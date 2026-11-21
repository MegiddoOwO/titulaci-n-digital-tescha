<?php

namespace Tests\Feature\Admin;

use App\Models\Asignacion;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ReplaceAsesorTest extends TestCase
{
    use DatabaseTransactions;

    // Seed: tramite 1 has asesor DOC-0001 (10) plus sinodales 11, 12, 13; tramite 2 has none.
    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    private function asesores(int $tramite): array
    {
        return Asignacion::where(['tramite_id' => $tramite, 'rol_asignacion' => 'asesor'])->pluck('usuario_id')->all();
    }

    public function test_replaces_previous_asesor_and_leaves_other_roles(): void
    {
        $new = $this->user('DOC-0004')->id;
        $sinodales = Asignacion::where(['tramite_id' => 1, 'rol_asignacion' => 'sinodal'])->pluck('id')->sort()->values()->all();

        $this->actingAs($this->user('ADM-0001'))->putJson('/admin/tramites/1/asesor', ['usuario_id' => $new])
            ->assertOk()->assertExactJson(['message' => 'Asesor actualizado.']);

        $this->assertSame([$new], $this->asesores(1));
        $this->assertSame($sinodales, Asignacion::where(['tramite_id' => 1, 'rol_asignacion' => 'sinodal'])->pluck('id')->sort()->values()->all());
    }

    public function test_assigns_when_there_was_no_asesor(): void
    {
        $new = $this->user('DOC-0004')->id;

        $this->actingAs($this->user('ADM-0001'))->putJson('/admin/tramites/2/asesor', ['usuario_id' => $new])->assertOk();

        $this->assertSame([$new], $this->asesores(2));
    }

    public function test_null_removes_only_asesor_assignments(): void
    {
        $this->actingAs($this->user('ADM-0001'))->putJson('/admin/tramites/1/asesor', ['usuario_id' => null])
            ->assertOk()->assertExactJson(['message' => 'Asesor removido.']);

        $this->assertSame([], $this->asesores(1));
        $this->assertSame(3, Asignacion::where(['tramite_id' => 1, 'rol_asignacion' => 'sinodal'])->count());
        $this->assertSame([10], $this->asesores(4)); // other tramites untouched
    }

    public function test_same_asesor_is_a_noop(): void
    {
        $before = Asignacion::where('tramite_id', 1)->pluck('id')->sort()->values()->all();

        $this->actingAs($this->user('ADM-0001'))->putJson('/admin/tramites/1/asesor', ['usuario_id' => 10])
            ->assertOk()->assertExactJson(['message' => 'Asesor actualizado.']);

        $this->assertSame($before, Asignacion::where('tramite_id', 1)->pluck('id')->sort()->values()->all());
    }

    public function test_carga_maxima_exceeded_rolls_back_and_keeps_previous_asesor(): void
    {
        $docente = $this->user('DOC-0004'); // current load 1
        $docente->update(['carga_maxima' => 1]);

        $this->actingAs($this->user('ADM-0001'))->putJson('/admin/tramites/1/asesor', ['usuario_id' => $docente->id])
            ->assertStatus(422)
            ->assertJsonPath('errors.usuario_id.0', 'El docente ha alcanzado su carga máxima de asesorías.');

        $this->assertSame([10], $this->asesores(1));
    }

    public function test_target_must_be_an_active_asesor(): void
    {
        $admin = $this->user('ADM-0001');
        $student = $this->user('2021-0001')->id;

        $this->actingAs($admin)->putJson('/admin/tramites/1/asesor', ['usuario_id' => $student])
            ->assertStatus(422)->assertJsonPath('errors.usuario_id.0', 'El usuario seleccionado no es un asesor activo.');
        $this->actingAs($admin)->putJson('/admin/tramites/1/asesor', ['usuario_id' => 999999])
            ->assertStatus(422);

        $inactive = $this->user('DOC-0004');
        $inactive->forceFill(['activo' => false])->save();
        $this->actingAs($admin)->putJson('/admin/tramites/1/asesor', ['usuario_id' => $inactive->id])->assertStatus(422);

        $this->assertSame([10], $this->asesores(1));
    }

    public function test_unknown_tramite_is_404(): void
    {
        $this->actingAs($this->user('ADM-0001'))->putJson('/admin/tramites/9999/asesor', ['usuario_id' => 10])
            ->assertNotFound()->assertJson(['message' => 'Trámite no encontrado.']);
    }

    public function test_role_isolation(): void
    {
        $this->actingAs($this->user('2021-0001'))->putJson('/admin/tramites/1/asesor', ['usuario_id' => null])->assertForbidden();
        $this->actingAs($this->user('DOC-0001'))->putJson('/admin/tramites/1/asesor', ['usuario_id' => null])->assertForbidden();
        auth()->logout();
        $this->put('/admin/tramites/1/asesor', ['usuario_id' => null])->assertRedirect();

        $this->assertSame([10], $this->asesores(1));
    }
}
