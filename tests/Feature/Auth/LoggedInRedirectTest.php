<?php

namespace Tests\Feature\Auth;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/**
 * Regression: a signed-in user who opens a guest-only page (login) used to be sent to the
 * student dashboard, which answers 403 for every other role. Also, accepting an invitation
 * while another account is signed in left that session open and landed on the same 403.
 */
class LoggedInRedirectTest extends TestCase
{
    use DatabaseTransactions;

    public function test_signed_in_users_visiting_login_land_on_their_own_panel(): void
    {
        foreach ([
            '2021-0001' => '/dashboard',
            'DOC-0001' => '/asesor',
            'ADM-0001' => '/admin',
        ] as $numeroControl => $home) {
            $usuario = Usuario::where('numero_control', $numeroControl)->firstOrFail();

            $this->actingAs($usuario)->get(route('login'))->assertRedirect($home);

            $this->flushSession();
        }
    }

    public function test_accepting_an_invitation_while_signed_in_as_someone_else_signs_that_account_out(): void
    {
        $admin = Usuario::where('numero_control', 'ADM-0001')->firstOrFail();

        $json = $this->actingAs($admin)->postJson('/admin/invitaciones', [
            'numero_control' => '2032-0001',
            'email' => '2032-0001@tescha.edu.mx',
            'nombre' => 'Probada',
            'apellido_paterno' => 'Con Sesion',
            'rol' => 'estudiante',
            'opcion_titulacion_id' => 1,
        ])->assertCreated()->json();

        $token = basename(parse_url($json['link'], PHP_URL_PATH));

        // Same browser session, still signed in as the administrator.
        $this->post(route('invitacion.aceptar', ['token' => $token]), [
            'password' => 'Segura1234',
            'password_confirmation' => 'Segura1234',
        ])
            ->assertRedirect(route('login'))
            ->assertSessionHas('status', 'Cuenta creada. Inicia sesión con tu número de control.');

        $this->assertGuest();
        $this->assertDatabaseHas('usuarios', ['numero_control' => '2032-0001', 'rol' => 'estudiante']);

        // The login page is reachable (no bounce to a forbidden panel) and the new account signs in.
        $this->get(route('login'))->assertOk();
        $this->post(route('login'), ['numero_control' => '2032-0001', 'password' => 'Segura1234'])
            ->assertRedirect('/dashboard');
        $this->assertAuthenticated();
    }
}
