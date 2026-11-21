<?php

namespace Tests\Feature\Admin;

use App\Models\Asignacion;
use App\Models\Documento;
use App\Models\Tramite;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UsuarioCrudTest extends TestCase
{
    use DatabaseTransactions;

    private function user(string $numero): Usuario
    {
        return Usuario::where('numero_control', $numero)->firstOrFail();
    }

    private function admin(): Usuario
    {
        return $this->user('ADM-0001');
    }

    /** @return array<string, mixed> */
    private function payload(array $overrides = []): array
    {
        return $overrides + [
            'numero_control' => '2030-9999',
            'email' => '2030-9999@tescha.edu.mx',
            'password' => 'Nueva1234!',
            'nombre' => 'Nuevo',
            'apellido_paterno' => 'Usuario',
            'rol' => 'estudiante',
        ];
    }

    public function test_list_filters_and_pagination(): void
    {
        $admin = $this->admin();
        $total = Usuario::count();

        $all = $this->actingAs($admin)->getJson('/admin/usuarios')->assertOk()
            ->assertJsonStructure(['usuarios' => [['id', 'numero_control', 'email', 'nombre', 'apellido_paterno',
                'apellido_materno', 'rol', 'activo', 'grado_academico', 'carga_maxima', 'intentos_fallidos', 'created_at']],
                'total', 'page', 'totalPages'])
            ->assertJsonPath('total', $total)->assertJsonPath('page', 1);
        $this->assertCount(min(20, $total), $all->json('usuarios'));
        $this->assertArrayNotHasKey('password_hash', $all->json('usuarios.0'));

        $asesores = $this->actingAs($admin)->getJson('/admin/usuarios?rol=asesor')->assertOk();
        $this->assertNotEmpty($asesores->json('usuarios'));
        $this->assertSame(['asesor'], array_values(array_unique(array_column($asesores->json('usuarios'), 'rol'))));

        $this->actingAs($admin)->getJson('/admin/usuarios?search=DOC-0001')
            ->assertJsonPath('total', 1)->assertJsonPath('usuarios.0.numero_control', 'DOC-0001');

        $this->actingAs($admin)->getJson('/admin/usuarios?page=-3')->assertJsonPath('page', 1);
        $this->actingAs($admin)->getJson('/admin/usuarios?page=999')
            ->assertJsonPath('usuarios', [])->assertJsonPath('page', 999);
    }

    public function test_show_hides_secrets_and_404s_for_unknown(): void
    {
        $admin = $this->admin();
        $student = $this->user('2021-0001');

        $this->actingAs($admin)->getJson("/admin/usuarios/{$student->id}")->assertOk()
            ->assertJsonPath('numero_control', '2021-0001')
            ->assertJsonPath('activo', 1)
            ->assertJsonMissingPath('password_hash')->assertJsonMissingPath('reset_token');

        $this->actingAs($admin)->getJson('/admin/usuarios/99999999')->assertNotFound()
            ->assertJsonPath('message', 'Usuario no encontrado.');
    }

    public function test_create_student_opens_tramite_documents_and_assignment(): void
    {
        $asesor = $this->user('DOC-0003');
        $before = Asignacion::count();

        $id = $this->actingAs($this->admin())->postJson('/admin/usuarios', $this->payload([
            'asesor_id' => $asesor->id,
            'opcion_titulacion_id' => 1,
        ]))->assertOk()->assertJsonPath('message', 'Usuario creado correctamente.')->json('id');

        $user = Usuario::findOrFail($id);
        $this->assertSame('estudiante', $user->rol);
        $this->assertNull($user->carga_maxima);
        $this->assertTrue(Hash::check('Nueva1234!', $user->password_hash));
        $this->assertSame((int) config('hashing.bcrypt.rounds'), password_get_info($user->password_hash)['options']['cost']);

        $tramite = Tramite::where('usuario_id', $id)->firstOrFail();
        $this->assertSame('en_proceso', $tramite->estatus);
        $this->assertSame(1, $tramite->opcion_titulacion_id);
        $this->assertGreaterThan(0, Documento::where('tramite_id', $tramite->id)->count());
        $this->assertSame(0, Documento::where('tramite_id', $tramite->id)->where('estatus', '!=', 'pendiente')->count());
        $this->assertDatabaseHas('asignaciones', [
            'tramite_id' => $tramite->id, 'usuario_id' => $asesor->id, 'rol_asignacion' => 'asesor',
        ]);
        $this->assertSame($before + 1, Asignacion::count());

        // The new student can authenticate right away.
        $this->post('/logout');
        $this->post('/login', ['numero_control' => '2030-9999', 'password' => 'Nueva1234!'])->assertRedirect();
    }

    public function test_create_student_skips_assignment_when_advisor_is_full(): void
    {
        $asesor = $this->user('DOC-0003');
        $asesor->update(['carga_maxima' => 1]); // already has 2 assignments in the seed

        $id = $this->actingAs($this->admin())
            ->postJson('/admin/usuarios', $this->payload(['asesor_id' => $asesor->id]))->assertOk()->json('id');

        $this->assertDatabaseMissing('asignaciones', [
            'tramite_id' => Tramite::where('usuario_id', $id)->value('id'), 'usuario_id' => $asesor->id,
        ]);
    }

    public function test_create_asesor_defaults_load_and_creates_no_tramite(): void
    {
        $id = $this->actingAs($this->admin())->postJson('/admin/usuarios', $this->payload([
            'rol' => 'asesor', 'numero_control' => 'DOC-9999', 'email' => 'doc9999@tescha.edu.mx', 'grado_academico' => 'Dr.',
        ]))->assertOk()->json('id');

        $this->assertSame(5, Usuario::find($id)->carga_maxima);
        $this->assertSame(0, Tramite::where('usuario_id', $id)->count());

        $other = $this->actingAs($this->admin())->postJson('/admin/usuarios', $this->payload([
            'rol' => 'asesor', 'numero_control' => 'DOC-9998', 'email' => 'doc9998@tescha.edu.mx', 'carga_maxima' => 8,
        ]))->json('id');
        $this->assertSame(8, Usuario::find($other)->carga_maxima);
    }

    public function test_create_validation_failures(): void
    {
        $admin = $this->admin();
        $before = Usuario::count();

        $this->actingAs($admin)->postJson('/admin/usuarios', ['nombre' => 'x'])->assertStatus(422)
            ->assertJsonPath('errors.numero_control.0', 'Campos requeridos: numero_control, email, password, nombre, apellido_paterno, rol.')
            ->assertJsonValidationErrors(['numero_control', 'email', 'password', 'apellido_paterno', 'rol']);

        $this->actingAs($admin)->postJson('/admin/usuarios', $this->payload(['rol' => 'root']))
            ->assertStatus(422)->assertJsonPath('errors.rol.0', 'Rol inválido.');

        $this->actingAs($admin)->postJson('/admin/usuarios', $this->payload(['numero_control' => '2021-0001']))
            ->assertStatus(422)
            ->assertJsonPath('errors.numero_control.0', 'Ya existe un usuario con ese número de control o email.');

        $this->actingAs($admin)->postJson('/admin/usuarios', $this->payload(['email' => $this->user('2021-0001')->email]))
            ->assertStatus(422)->assertJsonValidationErrors(['email']);

        $this->actingAs($admin)->postJson('/admin/usuarios', $this->payload(['opcion_titulacion_id' => 9999]))
            ->assertStatus(422)->assertJsonValidationErrors(['opcion_titulacion_id']);

        $this->assertSame($before, Usuario::count());
    }

    public function test_update_changes_present_fields_and_hashes_password(): void
    {
        $admin = $this->admin();
        $student = $this->user('2021-0002');

        $this->actingAs($admin)->putJson("/admin/usuarios/{$student->id}", [
            'nombre' => 'Renombrado', 'password' => 'Cambiada123!', 'grado_academico' => 'Ing.', 'apellido_materno' => null,
        ])->assertOk()->assertJsonPath('message', 'Usuario actualizado correctamente.');

        $student->refresh();
        $this->assertSame('Renombrado', $student->nombre);
        $this->assertSame('Ing.', $student->grado_academico);
        $this->assertNull($student->apellido_materno);
        $this->assertTrue(Hash::check('Cambiada123!', $student->password_hash));
        $this->assertSame('2021-0002', $student->numero_control);

        // Blank password keeps the hash (Express ignores empty passwords).
        $hash = $student->password_hash;
        $this->actingAs($admin)->putJson("/admin/usuarios/{$student->id}", ['password' => '', 'nombre' => 'Otra'])->assertOk();
        $this->assertSame($hash, $student->fresh()->password_hash);
    }

    public function test_update_failures(): void
    {
        $admin = $this->admin();
        $student = $this->user('2021-0002');

        $this->actingAs($admin)->putJson("/admin/usuarios/{$student->id}", [])
            ->assertStatus(422)->assertJsonPath('message', 'No hay campos para actualizar.');

        $this->actingAs($admin)->putJson("/admin/usuarios/{$student->id}", ['email' => $this->user('2021-0001')->email])
            ->assertStatus(422)->assertJsonValidationErrors(['email']);

        // Keeping the own email/numero is not a duplicate.
        $this->actingAs($admin)->putJson("/admin/usuarios/{$student->id}", [
            'email' => $student->email, 'numero_control' => $student->numero_control,
        ])->assertOk();

        $this->actingAs($admin)->putJson("/admin/usuarios/{$student->id}", ['rol' => 'root'])
            ->assertStatus(422)->assertJsonPath('errors.rol.0', 'Rol inválido.');

        $this->actingAs($admin)->putJson('/admin/usuarios/99999999', ['nombre' => 'x'])->assertNotFound();
    }

    public function test_toggle_flips_state_and_clears_lockout(): void
    {
        $admin = $this->admin();
        $student = $this->user('2021-0002');
        $student->forceFill(['intentos_fallidos' => 4, 'bloqueado_hasta' => now()->addMinutes(10)])->save();

        $this->actingAs($admin)->putJson("/admin/usuarios/{$student->id}/toggle")->assertOk()
            ->assertExactJson(['message' => 'Usuario desactivado.', 'activo' => 0]);

        $student->refresh();
        $this->assertFalse($student->activo);
        $this->assertSame(0, $student->intentos_fallidos);
        $this->assertNull($student->bloqueado_hasta);

        $this->actingAs($admin)->putJson("/admin/usuarios/{$student->id}/toggle")
            ->assertExactJson(['message' => 'Usuario activado.', 'activo' => 1]);

        $this->actingAs($admin)->putJson('/admin/usuarios/99999999/toggle')->assertNotFound();
    }

    public function test_delete_rules(): void
    {
        $admin = $this->admin();
        $student = $this->user('2021-0003');
        $tramiteIds = Tramite::where('usuario_id', $student->id)->pluck('id');
        $this->assertNotEmpty($tramiteIds);

        $this->actingAs($admin)->deleteJson("/admin/usuarios/{$admin->id}")
            ->assertStatus(422)->assertJsonPath('message', 'No puede eliminarse a sí mismo.');

        $this->actingAs($admin)->deleteJson("/admin/usuarios/{$student->id}")
            ->assertOk()->assertJsonPath('message', 'Usuario eliminado correctamente.');
        $this->assertNull(Usuario::find($student->id));
        $this->assertSame(0, Tramite::whereIn('id', $tramiteIds)->count()); // ON DELETE CASCADE

        $this->actingAs($admin)->deleteJson('/admin/usuarios/99999999')->assertNotFound();
    }

    public function test_last_active_admin_cannot_be_deleted(): void
    {
        $admin = $this->admin();
        $other = new Usuario($this->payload([
            'numero_control' => 'ADM-9999', 'email' => 'adm9999@tescha.edu.mx',
            'password_hash' => Hash::make('x'),
        ]));
        $other->forceFill(['rol' => 'administrativo', 'activo' => 0])->save();

        Usuario::where('numero_control', 'ADM-0002')->update(['activo' => 0]);

        // Only ADM-0001 is active, so even an inactive actor cannot remove it.
        $this->actingAs($other)->deleteJson("/admin/usuarios/{$admin->id}")
            ->assertStatus(422)->assertJsonPath('message', 'No se puede eliminar el último administrador activo.');
        $this->assertNotNull($admin->fresh());
    }

    public function test_user_with_issued_dictamen_cannot_be_deleted(): void
    {
        $issuer = Usuario::findOrFail(\App\Models\Dictamen::firstOrFail()->emitido_por);
        $actor = $issuer->numero_control === 'ADM-0001' ? $this->user('ADM-0002') : $this->admin();

        $this->actingAs($actor)->deleteJson("/admin/usuarios/{$issuer->id}")->assertStatus(422)
            ->assertJsonPath('message', 'No se puede eliminar el usuario porque tiene registros asociados.');
        $this->assertNotNull($issuer->fresh());
    }

    public function test_docentes_and_opciones_lookups(): void
    {
        $admin = $this->admin();

        $docentes = $this->actingAs($admin)->getJson('/admin/docentes')->assertOk()
            ->assertJsonStructure([['id', 'docente_id', 'numero_control', 'nombre_completo', 'carga_maxima', 'carga_actual']]);
        $numeros = array_column($docentes->json(), 'numero_control');
        foreach (['DOC-0001', 'DOC-0002', 'DOC-0003'] as $numero) {
            $this->assertContains($numero, $numeros);
        }
        $names = array_column($docentes->json(), 'nombre_completo');
        $sortedNames = $names;
        sort($sortedNames);
        $this->assertSame($sortedNames, $names);
        $this->assertSame(2, collect($docentes->json())->firstWhere('numero_control', 'DOC-0001')['carga_actual']);

        $opciones = $this->actingAs($admin)->getJson('/admin/opciones-titulacion')->assertOk()
            ->assertJsonStructure([['id', 'nombre']]);
        $this->assertNotEmpty($opciones->json());
        $this->assertSame(
            DB::table('opciones_titulacion')->where('activo', 1)->count(),
            count($opciones->json()),
        );
    }

    public function test_role_isolation(): void
    {
        $routes = [
            ['getJson', '/admin/usuarios'], ['postJson', '/admin/usuarios'], ['getJson', '/admin/usuarios/1'],
            ['putJson', '/admin/usuarios/1'], ['putJson', '/admin/usuarios/1/toggle'], ['deleteJson', '/admin/usuarios/1'],
            ['getJson', '/admin/docentes'], ['getJson', '/admin/opciones-titulacion'], ['getJson', '/admin/bitacora'],
        ];

        foreach (['2021-0001', 'DOC-0001'] as $numero) {
            foreach ($routes as [$method, $uri]) {
                $this->actingAs($this->user($numero))->{$method}($uri)->assertForbidden();
            }
        }

        foreach ($routes as [$method, $uri]) {
            $this->app['auth']->forgetGuards();
            $this->{$method}($uri)->assertUnauthorized();
        }
    }
}
