<?php

namespace Tests\Feature\Asesor;

use App\Models\Bitacora;
use App\Models\Documento;
use App\Models\HistorialEstado;
use App\Models\Notificacion;
use App\Models\Tramite;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AsesorFlowTest extends TestCase
{
    use DatabaseTransactions;

    // Seed: DOC-0001 (id 10) is assigned to tramites 1 (student 1) and 4. Tramite 5 belongs to
    // DOC-0002. Document 4 (tramite 1) is `cargado`, 5 is `cargado`, 31 (tramite 5) is `cargado`.
    private const DOC_OWN_A = 4;
    private const DOC_OWN_B = 5;
    private const DOC_FOREIGN = 31;

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    public function test_dashboard_lists_only_assigned_students(): void
    {
        $asesor = $this->user('DOC-0001');

        $this->actingAs($asesor)->get('/asesor')->assertInertia(fn (Assert $page) => $page
            ->component('Asesor/Home')
            ->has('estudiantes', 2)
            ->has('estudiantes.0', fn (Assert $e) => $e
                ->hasAll(['tramite_id', 'numero_control', 'nombre_completo', 'opcion_titulacion',
                    'estatus_tramite', 'rol_asignacion', 'porcentaje', 'color_semaforo']))
        );

        $json = $this->actingAs($asesor)->getJson('/asesor')->assertOk()->json('estudiantes');
        $this->assertEqualsCanonicalizing([1, 4], array_column($json, 'tramite_id'));
        $this->assertNotContains(5, array_column($json, 'tramite_id'));
    }

    public function test_approve_applies_all_side_effects(): void
    {
        $asesor = $this->user('DOC-0001');
        $before = [Bitacora::count(), HistorialEstado::count(), Notificacion::count()];

        $this->actingAs($asesor)->putJson('/asesor/documentos/'.self::DOC_OWN_A.'/aprobar')
            ->assertOk()->assertExactJson(['message' => 'Documento aprobado.']);

        $doc = Documento::find(self::DOC_OWN_A);
        $this->assertSame('aprobado', $doc->estatus);
        $this->assertSame($asesor->id, $doc->revisado_por);
        $this->assertNotNull($doc->fecha_revision);

        $this->assertDatabaseHas('historial_estados', [
            'documento_id' => self::DOC_OWN_A, 'estado_anterior' => 'cargado', 'estado_nuevo' => 'aprobado',
            'comentario' => 'Documento aprobado por administración.', 'usuario_id' => $asesor->id,
        ]);

        $student = Tramite::find(1)->usuario_id;
        $notification = Notificacion::where('usuario_id', $student)->where('titulo', 'Documento Aprobado')->latest('id')->first();
        $this->assertSame('ambos', $notification->tipo);
        $this->assertSame(1, $notification->tramite_id);
        $this->assertStringContainsString('ha sido aprobado por el comité de titulación', $notification->mensaje);

        $log = Bitacora::where('accion', 'Aprobación de documento')->latest('id')->first();
        $this->assertSame('documentos', $log->entidad);
        $this->assertSame(self::DOC_OWN_A, $log->entidad_id);
        $this->assertSame($asesor->id, $log->usuario_id);
        $this->assertSame(['tipo' => 'Comprobante de Pago de Derechos de Titulación', 'tramite_id' => 1], $log->detalle);

        $this->assertSame('en_revision', Tramite::find(1)->estatus);
        $this->assertSame($before[0] + 1, Bitacora::count());
        $this->assertSame($before[1] + 1, HistorialEstado::count());
        $this->assertSame($before[2] + 1, Notificacion::count());
    }

    public function test_reject_applies_side_effects_and_recomputes_tramite(): void
    {
        $asesor = $this->user('DOC-0001');

        $this->actingAs($asesor)->putJson('/asesor/documentos/'.self::DOC_OWN_B.'/rechazar', ['motivo' => '  Ilegible  '])
            ->assertOk()->assertExactJson(['message' => 'Documento rechazado.']);

        $doc = Documento::find(self::DOC_OWN_B);
        $this->assertSame('rechazado', $doc->estatus);
        $this->assertSame('Ilegible', $doc->motivo_rechazo);

        $this->assertDatabaseHas('historial_estados', [
            'documento_id' => self::DOC_OWN_B, 'estado_nuevo' => 'rechazado', 'comentario' => 'Ilegible',
        ]);
        $this->assertDatabaseHas('notificaciones', [
            'titulo' => 'Documento Rechazado', 'tramite_id' => 1,
            'mensaje' => 'Tu documento "Documento de Tesis" fue rechazado. Motivo: Ilegible',
        ]);

        $log = Bitacora::where('accion', 'Rechazo de documento')->latest('id')->first();
        $this->assertSame(['tipo' => 'Documento de Tesis', 'tramite_id' => 1, 'motivo' => 'Ilegible'], $log->detalle);
        $this->assertSame('rechazado', Tramite::find(1)->estatus);
    }

    public function test_unassigned_asesor_gets_403_and_nothing_changes(): void
    {
        $asesor = $this->user('DOC-0001');
        $logs = Bitacora::count();

        $this->actingAs($asesor)->putJson('/asesor/documentos/'.self::DOC_FOREIGN.'/aprobar')
            ->assertForbidden()->assertJson(['message' => 'No estás asignado a este trámite.']);
        $this->actingAs($asesor)->putJson('/asesor/documentos/'.self::DOC_FOREIGN.'/rechazar', ['motivo' => 'x'])
            ->assertForbidden();

        $this->assertSame('cargado', Documento::find(self::DOC_FOREIGN)->estatus);
        $this->assertSame($logs, Bitacora::count());
    }

    public function test_reject_requires_a_reason(): void
    {
        $asesor = $this->user('DOC-0001');

        foreach ([[], ['motivo' => ''], ['motivo' => '   ']] as $payload) {
            $this->actingAs($asesor)->putJson('/asesor/documentos/'.self::DOC_OWN_B.'/rechazar', $payload)
                ->assertStatus(422)->assertJsonValidationErrors(['motivo'])
                ->assertJsonPath('errors.motivo.0', 'El motivo de rechazo es requerido.');
        }

        $this->assertSame('cargado', Documento::find(self::DOC_OWN_B)->estatus);
    }

    public function test_missing_document_is_404(): void
    {
        $this->actingAs($this->user('DOC-0001'))->putJson('/asesor/documentos/999999/aprobar')
            ->assertNotFound()->assertJson(['message' => 'Documento no encontrado.']);
    }

    public function test_inertia_request_redirects_back_with_flash(): void
    {
        $this->actingAs($this->user('DOC-0001'))
            ->from('/asesor')
            ->withHeader('X-Inertia', 'true')
            ->put('/asesor/documentos/'.self::DOC_OWN_A.'/aprobar')
            ->assertRedirect('/asesor')
            ->assertSessionHas('success', 'Documento aprobado.');
    }

    public function test_inertia_reject_redirects_back_and_validates_reason(): void
    {
        $asesor = $this->user('DOC-0001');

        $this->actingAs($asesor)->from('/asesor')->withHeader('X-Inertia', 'true')
            ->put('/asesor/documentos/'.self::DOC_OWN_A.'/rechazar', ['motivo' => '  Ilegible  '])
            ->assertRedirect('/asesor')
            ->assertSessionHas('success', 'Documento rechazado.');
        $this->assertSame('rechazado', Documento::find(self::DOC_OWN_A)->estatus);
        $this->assertSame('Ilegible', Documento::find(self::DOC_OWN_A)->motivo_rechazo);

        $this->actingAs($asesor)->from('/asesor')->withHeader('X-Inertia', 'true')
            ->put('/asesor/documentos/'.self::DOC_OWN_B.'/rechazar', ['motivo' => ''])
            ->assertRedirect('/asesor')
            ->assertSessionHasErrors(['motivo' => 'El motivo de rechazo es requerido.']);
        $this->assertSame('cargado', Documento::find(self::DOC_OWN_B)->estatus);
    }

    public function test_dashboard_props_are_typed_for_the_page(): void
    {
        $this->actingAs($this->user('DOC-0001'))->get('/asesor')->assertInertia(fn (Assert $page) => $page
            ->component('Asesor/Home')
            ->where('auth.user.rol', 'asesor')
            ->has('estudiantes', 2, fn (Assert $e) => $e
                ->whereType('tramite_id', 'integer')
                ->whereType('porcentaje', 'integer|double')
                ->whereType('estatus_tramite', 'string')
                ->whereType('color_semaforo', 'string')
                ->etc())
        );
    }

    public function test_role_isolation(): void
    {
        $student = $this->user('2021-0001');
        $admin = $this->user('ADM-0001');

        $this->actingAs($student)->getJson('/asesor')->assertForbidden();
        $this->actingAs($student)->putJson('/asesor/documentos/4/aprobar')->assertForbidden();
        $this->actingAs($admin)->getJson('/asesor')->assertForbidden();
        $this->actingAs($admin)->putJson('/asesor/documentos/4/aprobar')->assertForbidden();
        $this->assertSame('cargado', Documento::find(4)->estatus);
    }
}
