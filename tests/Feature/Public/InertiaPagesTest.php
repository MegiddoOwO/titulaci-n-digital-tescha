<?php

namespace Tests\Feature\Public;

use App\Models\Normativa;
use App\Models\OpcionTitulacion;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InertiaPagesTest extends TestCase
{
    use DatabaseTransactions;

    private function userWithRole(string $rol): Usuario
    {
        return Usuario::where('rol', $rol)->where('activo', 1)->orderBy('id')->firstOrFail();
    }

    public function test_guest_sees_landing_page(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Landing'));
    }

    public function test_authenticated_users_are_redirected_to_their_role_home(): void
    {
        foreach (['estudiante' => '/dashboard', 'asesor' => '/asesor', 'administrativo' => '/admin'] as $rol => $path) {
            $this->actingAs($this->userWithRole($rol))->get('/')->assertRedirect($path);
        }
    }

    public function test_normativa_page_lists_active_entries_for_guests(): void
    {
        $this->get('/normativa')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Normativa')
            ->where('modalidadId', null)
            ->has('normativa', Normativa::where('activo', 1)->count())
            ->has('normativa.0', fn (Assert $item) => $item
                ->hasAll(['id', 'titulo', 'contenido', 'categoria', 'modalidad_id', 'orden', 'modalidad_nombre'])));
    }

    public function test_normativa_page_applies_modalidad_filter(): void
    {
        $opcion = OpcionTitulacion::create(['nombre' => 'Opción filtro']);
        $other = OpcionTitulacion::create(['nombre' => 'Otra opción']);
        $specific = Normativa::create(['titulo' => 'Específica', 'contenido' => 'x', 'modalidad_id' => $opcion->id]);
        $foreign = Normativa::create(['titulo' => 'Ajena', 'contenido' => 'x', 'modalidad_id' => $other->id]);

        $this->get("/normativa?modalidad_id={$opcion->id}")->assertInertia(function (Assert $page) use ($opcion, $specific, $foreign) {
            $page->component('Normativa')->where('modalidadId', $opcion->id);
            $ids = array_column($page->toArray()['props']['normativa'], 'id');
            $this->assertContains($specific->id, $ids);
            $this->assertNotContains($foreign->id, $ids);
        });
    }

    public function test_normativa_keeps_the_plain_json_contract(): void
    {
        $this->getJson('/normativa')->assertOk()->assertJsonStructure([['id', 'titulo']]);
    }

    public function test_login_page_carries_only_registration_contacts(): void
    {
        $this->get('/login')->assertOk()->assertInertia(function (Assert $page) {
            $page->component('Auth/Login')->has('contactos');
            foreach ($page->toArray()['props']['contactos'] as $contacto) {
                $this->assertMatchesRegularExpression('/Control Escolar|Jefatura/', $contacto['departamento']);
            }
        });
    }

    public function test_forgot_password_page_redirects_to_login_modal(): void
    {
        $this->get('/forgot-password')->assertRedirect('/login');
    }

    public function test_logout_returns_to_the_landing_page(): void
    {
        $this->actingAs($this->userWithRole('estudiante'))->post('/logout')->assertRedirect('/');
        $this->assertGuest();
    }

    public function test_unknown_url_renders_the_not_found_page(): void
    {
        $this->get('/no-existe-esta-ruta')->assertNotFound()->assertInertia(fn (Assert $page) => $page->component('NotFound'));
        $this->getJson('/no-existe-esta-ruta')->assertNotFound();
    }

    public function test_shared_auth_props_expose_profile_fields_but_no_secrets(): void
    {
        $user = $this->userWithRole('estudiante');

        $this->actingAs($user)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.email', $user->email)
            ->where('auth.user.nombre', $user->nombre)
            ->where('auth.user.apellido_paterno', $user->apellido_paterno)
            ->missing('auth.user.password_hash'));
    }

    public function test_login_success_flashes_a_welcome_message(): void
    {
        $user = $this->userWithRole('estudiante');

        $this->post('/login', ['numero_control' => $user->numero_control, 'password' => 'Demo1234!'])
            ->assertRedirect('/dashboard')
            ->assertSessionHas('success', 'Has iniciado sesión correctamente.');
    }

    public function test_dashboard_defers_historial(): void
    {
        $this->actingAs($this->userWithRole('estudiante'))->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->missing('historial')
            ->loadDeferredProps(fn (Assert $reloaded) => $reloaded->has('historial')));
    }
}
