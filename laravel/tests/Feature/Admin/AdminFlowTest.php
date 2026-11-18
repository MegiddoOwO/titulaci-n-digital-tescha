<?php

namespace Tests\Feature\Admin;

use App\Models\Asignacion;
use App\Models\Bitacora;
use App\Models\Dictamen;
use App\Models\Documento;
use App\Models\HistorialEstado;
use App\Models\Tramite;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminFlowTest extends TestCase
{
    use DatabaseTransactions;

    // Seed tramites: 1 en_revision (student 2021-0001), 2/3 en_proceso, 4 aprobado (has dictamen),
    // 5 rechazado. DOC-0001 (10) has 2 assignments (max 5); DOC-0002 (11) 2; DOC-0003 (12) 2.
    private function user(string $numero = 'ADM-0001'): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    public function test_stats_shape_and_values_match_seed(): void
    {
        $admin = $this->user();

        $this->actingAs($admin)->getJson('/admin/stats')->assertOk()->assertJsonStructure([
            'total_activos', 'pendientes_revision', 'dictamenes_emitidos', 'en_proceso',
            'por_estatus' => ['en_proceso', 'en_revision', 'aprobado', 'rechazado', 'completado'],
        ])->assertJsonPath('total_activos', 5)
            ->assertJsonPath('dictamenes_emitidos', 1)
            ->assertJsonPath('en_proceso', 3)
            ->assertJsonPath('por_estatus.aprobado', 1)
            ->assertJsonPath('por_estatus.rechazado', 1);

        $this->actingAs($admin)->get('/admin')->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Home')->where('stats.total_activos', 5)->has('stats.por_estatus'));
        $this->actingAs($admin)->getJson('/admin')->assertOk()->assertJsonPath('total_activos', 5);
    }

    public function test_expedientes_list_filters_and_pagination(): void
    {
        $admin = $this->user();

        $all = $this->actingAs($admin)->getJson('/admin/expedientes')->assertOk()
            ->assertJsonStructure(['expedientes' => [['id', 'numero_control', 'nombre_completo', 'opcion_titulacion',
                'estatus', 'titulo_proyecto', 'total_docs', 'docs_aprobados', 'docs_rechazados', 'docs_cargados',
                'docs_en_revision', 'color_semaforo', 'porcentaje', 'fecha_inicio', 'fecha_actualizacion']],
                'total', 'page', 'totalPages'])
            ->assertJsonPath('total', 5)->assertJsonPath('page', 1)->assertJsonPath('totalPages', 1);
        $this->assertCount(5, $all->json('expedientes'));

        $this->actingAs($admin)->getJson('/admin/expedientes?estatus=aprobado')
            ->assertJsonPath('total', 1)->assertJsonPath('expedientes.0.id', 4);

        $this->actingAs($admin)->getJson('/admin/expedientes?search=2021-0003')
            ->assertJsonPath('total', 1)->assertJsonPath('expedientes.0.numero_control', '2021-0003');

        $paged = $this->actingAs($admin)->getJson('/admin/expedientes?limit=2&page=3')
            ->assertJsonPath('total', 5)->assertJsonPath('page', 3)->assertJsonPath('totalPages', 3);
        $this->assertCount(1, $paged->json('expedientes'));

        // Clamping: page < 1 becomes 1, limit capped at 100.
        $this->actingAs($admin)->getJson('/admin/expedientes?page=-4&limit=1000')
            ->assertJsonPath('page', 1)->assertJsonPath('totalPages', 1);

        $this->actingAs($admin)->get('/admin/expedientes')->assertInertia(fn (Assert $p) => $p
            ->component('Admin/Expedientes/Index')->where('total', 5)->has('expedientes', 5));
    }

    public function test_expediente_detail_matches_express_shape(): void
    {
        $admin = $this->user();

        $this->actingAs($admin)->getJson('/admin/expedientes/1')->assertOk()
            ->assertJsonPath('id', 1)
            ->assertJsonCount(7, 'documentos')
            ->assertJsonPath('progreso.total', 7)
            ->assertJsonPath('progreso.aprobados', 2)
            ->assertJsonPath('progreso.porcentaje', 29)
            ->assertJsonPath('progreso.color_semaforo', 'ambar')
            ->assertJsonCount(4, 'asignaciones')
            ->assertJsonPath('asignaciones.0.rol_asignacion', 'asesor')
            ->assertJsonStructure(['asignaciones' => [['id', 'rol_asignacion', 'nombre', 'apellido_paterno', 'grado_academico', 'email']]])
            ->assertJsonPath('dictamen', null);

        $this->actingAs($admin)->getJson('/admin/expedientes/4')->assertJsonPath('dictamen.resultado', 'aprobado');
        $this->actingAs($admin)->getJson('/admin/expedientes/5')->assertJsonPath('progreso.color_semaforo', 'rojo');
        $this->actingAs($admin)->getJson('/admin/expedientes/999')->assertNotFound()
            ->assertJson(['message' => 'Trámite no encontrado.']);

        $this->actingAs($admin)->get('/admin/expedientes/1')->assertInertia(fn (Assert $p) => $p
            ->component('Admin/Expedientes/Show')->where('tramite.id', 1));
    }

    public function test_update_expediente(): void
    {
        $admin = $this->user();

        $this->actingAs($admin)->putJson('/admin/expedientes/2', ['titulo_proyecto' => 'Nuevo título', 'opcion_titulacion_id' => 1])
            ->assertOk()->assertExactJson(['message' => 'Trámite actualizado.']);

        $t = Tramite::find(2);
        $this->assertSame('Nuevo título', $t->titulo_proyecto);
        $this->assertSame(1, $t->opcion_titulacion_id);

        $this->actingAs($admin)->putJson('/admin/expedientes/2', [])
            ->assertStatus(422)->assertJsonPath('errors.titulo_proyecto.0', 'No hay campos para actualizar.');
        $this->actingAs($admin)->putJson('/admin/expedientes/2', ['opcion_titulacion_id' => 9999])->assertStatus(422);
        $this->actingAs($admin)->putJson('/admin/expedientes/999', ['titulo_proyecto' => 'x'])->assertNotFound();
    }

    public function test_toggle_expediente_cancels_and_reopens(): void
    {
        $admin = $this->user();

        $this->actingAs($admin)->putJson('/admin/expedientes/3/toggle')
            ->assertOk()->assertExactJson(['message' => 'Trámite cancelado.', 'activo' => 0]);
        $this->assertFalse(Tramite::find(3)->activo);
        $this->actingAs($admin)->getJson('/admin/expedientes/3')->assertNotFound();
        $this->actingAs($admin)->getJson('/admin/stats')->assertJsonPath('total_activos', 4);

        $this->actingAs($admin)->putJson('/admin/expedientes/3/toggle')
            ->assertOk()->assertExactJson(['message' => 'Trámite reactivado.', 'activo' => 1]);
        $this->assertTrue(Tramite::find(3)->activo);
    }

    public function test_admin_approve_and_reject_documents(): void
    {
        $admin = $this->user();
        $logs = Bitacora::count();

        // Admin may review a document of any tramite (31 belongs to tramite 5, assigned to DOC-0002).
        $this->actingAs($admin)->putJson('/admin/documentos/31/aprobar')
            ->assertOk()->assertExactJson(['message' => 'Documento aprobado correctamente.', 'tramite_id' => 5]);
        $this->assertSame('aprobado', Documento::find(31)->estatus);
        $this->assertSame($admin->id, Documento::find(31)->revisado_por);
        $this->assertSame('rechazado', Tramite::find(5)->estatus); // doc 30 is still rejected

        $this->actingAs($admin)->putJson('/admin/documentos/4/rechazar', ['motivo' => 'Borroso'])
            ->assertOk()->assertExactJson(['message' => 'Documento rechazado correctamente.', 'tramite_id' => 1]);
        $this->assertSame('rechazado', Tramite::find(1)->estatus);
        $this->assertDatabaseHas('historial_estados', ['documento_id' => 4, 'estado_nuevo' => 'rechazado', 'comentario' => 'Borroso']);
        $this->assertSame($logs + 2, Bitacora::count());

        $this->actingAs($admin)->putJson('/admin/documentos/4/rechazar', ['motivo' => ''])
            ->assertStatus(422)->assertJsonPath('errors.motivo.0', 'El motivo de rechazo es requerido.');
        $this->actingAs($admin)->putJson('/admin/documentos/999999/aprobar')
            ->assertNotFound()->assertJson(['message' => 'Documento no encontrado.']);
    }

    public function test_admin_cannot_approve_a_never_uploaded_document(): void
    {
        $admin = $this->user();
        Documento::whereKey(31)->update(['estatus' => 'pendiente']);
        $counts = [Bitacora::count(), HistorialEstado::count(), \App\Models\Notificacion::count()];

        $this->actingAs($admin)->putJson('/admin/documentos/31/aprobar')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Solo se pueden aprobar documentos que ya fueron subidos.')
            ->assertJsonPath('errors.documento.0', 'Solo se pueden aprobar documentos que ya fueron subidos.');

        $this->assertSame('pendiente', Documento::find(31)->estatus);
        $this->assertSame($counts, [Bitacora::count(), HistorialEstado::count(), \App\Models\Notificacion::count()]);

        // en_revision is still approvable.
        Documento::whereKey(31)->update(['estatus' => 'en_revision']);
        $this->actingAs($admin)->putJson('/admin/documentos/31/aprobar')->assertOk();
        $this->assertSame('aprobado', Documento::find(31)->estatus);
    }

    public function test_approving_last_pending_document_approves_the_tramite(): void
    {
        $admin = $this->user();
        // Tramite 5: approve its rejected doc (30) then the remaining ones until all are approved.
        Documento::where('tramite_id', 5)->whereNotIn('id', [31])->update(['estatus' => 'aprobado']);
        $history = HistorialEstado::count();

        $this->actingAs($admin)->putJson('/admin/documentos/31/aprobar')->assertOk();

        $this->assertSame('aprobado', Tramite::find(5)->estatus);
        $this->assertSame($history + 2, HistorialEstado::count()); // document row + global row
        $this->assertDatabaseHas('historial_estados', [
            'tramite_id' => 5, 'documento_id' => null, 'estado_anterior' => 'en_revision',
            'estado_nuevo' => 'aprobado', 'comentario' => 'Todos los documentos obligatorios aprobados.', 'usuario_id' => null,
        ]);
    }

    public function test_assignment_create_delete_and_duplicates(): void
    {
        $admin = $this->user();
        $docente = $this->user('DOC-0004')->id; // sinodal on tramite 1 only
        $before = Asignacion::count();

        $this->actingAs($admin)->postJson('/admin/asignaciones', ['tramite_id' => 2, 'usuario_id' => $docente, 'rol_asignacion' => 'revisor'])
            ->assertOk()->assertExactJson(['message' => 'Asignación creada.']);
        $this->assertSame($before + 1, Asignacion::count());
        $created = Asignacion::where(['tramite_id' => 2, 'usuario_id' => $docente, 'rol_asignacion' => 'revisor'])->firstOrFail();

        // Duplicate: ignored silently (INSERT IGNORE), still reported as created.
        $this->actingAs($admin)->postJson('/admin/asignaciones', ['tramite_id' => 2, 'usuario_id' => $docente, 'rol_asignacion' => 'revisor'])
            ->assertOk()->assertExactJson(['message' => 'Asignación creada.']);
        $this->assertSame($before + 1, Asignacion::count());

        $this->actingAs($admin)->deleteJson('/admin/asignaciones/'.$created->id)
            ->assertOk()->assertExactJson(['message' => 'Asignación eliminada.']);
        $this->assertSame($before, Asignacion::count());

        // Faithful: deleting an unknown id still succeeds.
        $this->actingAs($admin)->deleteJson('/admin/asignaciones/999999')->assertOk();
    }

    public function test_assignment_validation_and_role_rules(): void
    {
        $admin = $this->user();
        $docente = $this->user('DOC-0004')->id;
        $required = 'tramite_id, usuario_id y rol_asignacion (asesor|sinodal|revisor) son requeridos.';

        $this->actingAs($admin)->postJson('/admin/asignaciones', ['tramite_id' => 2, 'usuario_id' => $docente, 'rol_asignacion' => 'director'])
            ->assertStatus(422)->assertJsonPath('errors.rol_asignacion.0', $required);
        $this->actingAs($admin)->postJson('/admin/asignaciones', ['usuario_id' => $docente, 'rol_asignacion' => 'asesor'])
            ->assertStatus(422)->assertJsonPath('errors.tramite_id.0', $required);
        $this->actingAs($admin)->postJson('/admin/asignaciones', ['tramite_id' => 999, 'usuario_id' => $docente, 'rol_asignacion' => 'asesor'])
            ->assertStatus(422)->assertJsonPath('errors.tramite_id.0', 'Trámite no encontrado.');
    }

    public function test_assignment_rejected_when_docente_reached_carga_maxima(): void
    {
        $admin = $this->user();
        $docente = $this->user('DOC-0004'); // asesor, current load 1
        $docente->update(['carga_maxima' => 1]);
        $before = Asignacion::count();

        $this->actingAs($admin)->postJson('/admin/asignaciones', ['tramite_id' => 2, 'usuario_id' => $docente->id, 'rol_asignacion' => 'asesor'])
            ->assertStatus(422)
            ->assertJsonPath('errors.usuario_id.0', 'El docente ha alcanzado su carga máxima de asesorías.');
        $this->assertSame($before, Asignacion::count());

        $docente->update(['carga_maxima' => 2]);
        $this->actingAs($admin)->postJson('/admin/asignaciones', ['tramite_id' => 2, 'usuario_id' => $docente->id, 'rol_asignacion' => 'asesor'])
            ->assertOk();
    }

    public function test_dictamen_approved_requires_all_mandatory_documents_approved(): void
    {
        $admin = $this->user();

        // Tramite 1 still has unapproved mandatory documents.
        $this->actingAs($admin)->postJson('/admin/dictamenes', ['tramite_id' => 1, 'resultado' => 'aprobado'])
            ->assertStatus(422)
            ->assertJsonPath('errors.tramite_id.0', fn ($m) => str_starts_with($m, 'No se puede aprobar el dictamen. Los siguientes documentos obligatorios no han sido aprobados: ')
                && str_contains($m, 'Comprobante de Pago de Derechos de Titulación'));
        $this->assertNull(Dictamen::where('tramite_id', 1)->first());
    }

    public function test_dictamen_rejected_creates_record_with_audit_trail(): void
    {
        $admin = $this->user();
        $student = Tramite::find(1)->usuario_id;

        $this->actingAs($admin)->postJson('/admin/dictamenes', ['tramite_id' => 1, 'resultado' => 'rechazado', 'observaciones' => 'Falta documentación'])
            ->assertOk()->assertExactJson(['message' => 'Dictamen emitido correctamente.']);

        $d = Dictamen::where('tramite_id', 1)->firstOrFail();
        $this->assertSame('rechazado', $d->resultado);
        $this->assertSame($admin->id, $d->emitido_por);

        $t = Tramite::find(1);
        $this->assertSame('rechazado', $t->estatus);
        $this->assertNotNull($t->fecha_fin);

        $this->assertDatabaseHas('notificaciones', [
            'usuario_id' => $student, 'titulo' => 'Trámite Rechazado', 'tipo' => 'ambos', 'tramite_id' => 1,
            'mensaje' => 'Tu trámite fue rechazado. Motivo: Falta documentación. Contacta a Control Escolar para más información.',
        ]);
        $log = Bitacora::where('accion', 'Emisión de dictamen')->latest('id')->first();
        $this->assertSame('dictamenes', $log->entidad);
        $this->assertSame(1, $log->entidad_id);
        $this->assertSame(['resultado' => 'rechazado', 'observaciones' => 'Falta documentación'], $log->detalle);
        $this->assertDatabaseHas('historial_estados', [
            'tramite_id' => 1, 'documento_id' => null, 'estado_anterior' => 'en_revision',
            'estado_nuevo' => 'rechazado', 'comentario' => 'Falta documentación', 'usuario_id' => $admin->id,
        ]);
    }

    public function test_dictamen_approved_on_fully_approved_tramite_updates_existing_record(): void
    {
        $admin = $this->user();
        $count = Dictamen::count();

        // Tramite 4 is fully approved and already has a dictamen: it is updated, not duplicated.
        $this->actingAs($admin)->postJson('/admin/dictamenes', ['tramite_id' => 4, 'resultado' => 'aprobado', 'observaciones' => 'Ok'])
            ->assertOk();

        $this->assertSame($count, Dictamen::count());
        $this->assertSame('completado', Tramite::find(4)->estatus);
        $this->assertSame($admin->id, Dictamen::where('tramite_id', 4)->value('emitido_por'));
        $this->assertDatabaseHas('notificaciones', ['titulo' => 'Trámite Aprobado', 'tramite_id' => 4]);
    }

    public function test_dictamen_validation(): void
    {
        $admin = $this->user();

        $this->actingAs($admin)->postJson('/admin/dictamenes', ['resultado' => 'aprobado'])
            ->assertStatus(422)->assertJsonPath('errors.tramite_id.0', 'tramite_id y resultado son requeridos.');
        $this->actingAs($admin)->postJson('/admin/dictamenes', ['tramite_id' => 1])
            ->assertStatus(422)->assertJsonPath('errors.resultado.0', 'tramite_id y resultado son requeridos.');
        $this->actingAs($admin)->postJson('/admin/dictamenes', ['tramite_id' => 1, 'resultado' => 'quizas'])
            ->assertStatus(422)->assertJsonPath('errors.resultado.0', "resultado debe ser 'aprobado' o 'rechazado'.");
        $this->actingAs($admin)->postJson('/admin/dictamenes', ['tramite_id' => 999, 'resultado' => 'rechazado'])
            ->assertStatus(422)->assertJsonPath('errors.tramite_id.0', 'Trámite no encontrado.');
    }

    public function test_non_admin_roles_are_forbidden_everywhere_under_admin(): void
    {
        $routes = [
            ['getJson', '/admin'], ['getJson', '/admin/stats'], ['getJson', '/admin/expedientes'],
            ['getJson', '/admin/expedientes/1'], ['putJson', '/admin/expedientes/1'],
            ['putJson', '/admin/expedientes/1/toggle'], ['putJson', '/admin/documentos/4/aprobar'],
            ['putJson', '/admin/documentos/4/rechazar'], ['postJson', '/admin/dictamenes'],
            ['postJson', '/admin/asignaciones'], ['deleteJson', '/admin/asignaciones/1'],
        ];

        foreach (['2021-0001', 'DOC-0001'] as $numero) {
            foreach ($routes as [$method, $url]) {
                $this->actingAs($this->user($numero))->{$method}($url)->assertForbidden();
            }
        }

        $this->assertSame('cargado', Documento::find(4)->estatus);
        $this->assertTrue(Tramite::find(1)->activo);
    }
}
