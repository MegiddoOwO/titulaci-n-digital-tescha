<?php

namespace Tests\Feature\Asesor;

use App\Models\Tramite;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/**
 * Deliberate addition over Express: GET /asesor/expedientes/{tramite}. Seed: DOC-0001 is assigned to
 * tramites 1 and 4; tramite 5 belongs to DOC-0002.
 */
class AsesorExpedienteTest extends TestCase
{
    use DatabaseTransactions;

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    public function test_assigned_asesor_gets_the_admin_detail_shape(): void
    {
        $this->actingAs($this->user('DOC-0001'))->getJson('/asesor/expedientes/1')->assertOk()
            ->assertJsonPath('id', 1)
            ->assertJsonStructure(['id', 'usuario_id', 'estatus', 'opcion_titulacion', 'documentos' => [['tipo_documento_id', 'estatus']],
                'asignaciones' => [['id', 'rol_asignacion', 'nombre']], 'dictamen', 'progreso' => ['total', 'aprobados', 'porcentaje']]);

        $this->actingAs($this->user('DOC-0001'))->getJson('/asesor/expedientes/4')->assertOk()->assertJsonPath('id', 4);
    }

    public function test_detail_fetch_as_the_page_does_it_returns_json_not_a_page(): void
    {
        $this->actingAs($this->user('DOC-0001'))
            ->withHeaders(['Accept' => 'application/json', 'X-Requested-With' => 'XMLHttpRequest'])
            ->get('/asesor/expedientes/1')->assertOk()
            ->assertJsonStructure(['estatus', 'progreso' => ['color_semaforo', 'porcentaje'],
                'documentos' => [['id', 'tipo_documento_nombre', 'tipo_documento_obligatorio', 'motivo_rechazo', 'archivo_nombre', 'fecha_subida']]]);
    }

    public function test_unassigned_asesor_is_forbidden(): void
    {
        $this->actingAs($this->user('DOC-0001'))->getJson('/asesor/expedientes/5')->assertForbidden();
    }

    public function test_unknown_or_cancelled_tramite_is_404(): void
    {
        $asesor = $this->user('DOC-0001');
        $this->actingAs($asesor)->getJson('/asesor/expedientes/99999999')->assertNotFound();

        Tramite::whereKey(1)->update(['activo' => 0]);
        $this->actingAs($asesor)->getJson('/asesor/expedientes/1')->assertNotFound();
    }

    public function test_other_roles_are_forbidden_and_guests_unauthorized(): void
    {
        $this->actingAs($this->user('2021-0001'))->getJson('/asesor/expedientes/1')->assertForbidden();
        $this->actingAs($this->user('ADM-0001'))->getJson('/asesor/expedientes/1')->assertForbidden();

        $this->app['auth']->forgetGuards();
        $this->getJson('/asesor/expedientes/1')->assertUnauthorized();
    }
}
