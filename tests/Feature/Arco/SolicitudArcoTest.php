<?php

namespace Tests\Feature\Arco;

use App\Models\SolicitudArco;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class SolicitudArcoTest extends TestCase
{
    use DatabaseTransactions;

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    public function test_any_role_creates_a_pending_request(): void
    {
        foreach (['2021-0001', 'DOC-0001', 'ADM-0001'] as $numero) {
            $user = $this->user($numero);

            $this->actingAs($user)->postJson('/solicitudes-arco', ['tipo' => 'acceso', 'detalle' => 'Quiero mis datos'])
                ->assertOk()
                ->assertExactJson(['message' => 'Solicitud ARCO registrada. Será procesada en un máximo de 15 días hábiles.']);

            $this->assertDatabaseHas('solicitudes_arco', [
                'usuario_id' => $user->id, 'tipo' => 'acceso', 'estado' => 'pendiente',
                'detalle_solicitud' => 'Quiero mis datos', 'atendido_por' => null,
            ]);
        }
    }

    public function test_detail_is_optional_and_type_is_validated(): void
    {
        $student = $this->user('2021-0001');

        $this->actingAs($student)->postJson('/solicitudes-arco', ['tipo' => 'oposicion'])->assertOk();
        $this->assertNull(SolicitudArco::where('usuario_id', $student->id)->firstOrFail()->detalle_solicitud);

        $message = 'Tipo de solicitud inválido. Use: acceso, rectificación, cancelación u oposición.';
        $this->actingAs($student)->postJson('/solicitudes-arco', [])
            ->assertStatus(422)->assertJsonPath('errors.tipo.0', $message);
        $this->actingAs($student)->postJson('/solicitudes-arco', ['tipo' => 'rectificación'])
            ->assertStatus(422)->assertJsonPath('errors.tipo.0', $message);

        $this->assertSame(1, SolicitudArco::where('usuario_id', $student->id)->count());
    }

    public function test_requires_authentication(): void
    {
        $this->postJson('/solicitudes-arco', ['tipo' => 'acceso'])->assertUnauthorized();
        $this->getJson('/solicitudes-arco')->assertUnauthorized();
    }

    public function test_user_only_lists_own_requests(): void
    {
        $a = $this->user('2021-0001');
        $b = $this->user('2021-0002');
        $mine = SolicitudArco::create(['usuario_id' => $a->id, 'tipo' => 'acceso']);
        SolicitudArco::create(['usuario_id' => $b->id, 'tipo' => 'cancelacion']);

        $rows = $this->actingAs($a)->getJson('/solicitudes-arco')->assertOk()
            ->assertJsonStructure([['id', 'tipo', 'estado', 'detalle_solicitud', 'respuesta', 'fecha_solicitud', 'fecha_resolucion']])
            ->json();
        $this->assertSame([$mine->id], array_column($rows, 'id'));
        $this->assertArrayNotHasKey('usuario_id', $rows[0]);
    }

    public function test_admin_lists_all_with_requester_data(): void
    {
        $a = $this->user('2021-0001');
        $b = $this->user('2021-0002');
        SolicitudArco::create(['usuario_id' => $a->id, 'tipo' => 'acceso']);
        SolicitudArco::create(['usuario_id' => $b->id, 'tipo' => 'cancelacion']);

        $rows = $this->actingAs($this->user('ADM-0001'))->getJson('/admin/solicitudes-arco')->assertOk()
            ->assertJsonStructure([['id', 'tipo', 'estado', 'detalle_solicitud', 'respuesta', 'fecha_solicitud',
                'fecha_resolucion', 'numero_control', 'nombre_completo']])->json();

        $this->assertEqualsCanonicalizing(['2021-0001', '2021-0002'], array_column($rows, 'numero_control'));
    }

    public function test_admin_resolves_and_validates(): void
    {
        $admin = $this->user('ADM-0001');
        $request = SolicitudArco::create(['usuario_id' => $this->user('2021-0001')->id, 'tipo' => 'acceso']);

        $this->actingAs($admin)->putJson("/admin/solicitudes-arco/{$request->id}", ['estado' => 'en_proceso'])
            ->assertOk()->assertExactJson(['message' => 'Solicitud actualizada.']);
        $request->refresh();
        $this->assertSame('en_proceso', $request->estado);
        $this->assertNull($request->respuesta);
        $this->assertNotNull($request->fecha_resolucion);

        $this->actingAs($admin)->putJson("/admin/solicitudes-arco/{$request->id}", ['estado' => 'completada', 'respuesta' => 'Listo'])->assertOk();
        $request->refresh();
        $this->assertSame(['completada', 'Listo'], [$request->estado, $request->respuesta]);

        $this->actingAs($admin)->putJson("/admin/solicitudes-arco/{$request->id}", ['estado' => 'pendiente'])
            ->assertStatus(422)->assertJsonPath('errors.estado.0', 'Estado inválido.');
        $this->actingAs($admin)->putJson("/admin/solicitudes-arco/{$request->id}", [])->assertStatus(422);
        $this->actingAs($admin)->putJson('/admin/solicitudes-arco/99999999', ['estado' => 'rechazada'])->assertNotFound();
    }

    public function test_non_admin_cannot_use_admin_endpoints(): void
    {
        $request = SolicitudArco::create(['usuario_id' => $this->user('2021-0001')->id, 'tipo' => 'acceso']);

        foreach (['2021-0001', 'DOC-0001'] as $numero) {
            $this->actingAs($this->user($numero))->getJson('/admin/solicitudes-arco')->assertForbidden();
            $this->actingAs($this->user($numero))
                ->putJson("/admin/solicitudes-arco/{$request->id}", ['estado' => 'completada'])->assertForbidden();
        }
        $this->assertSame('pendiente', $request->fresh()->estado);
    }
}
