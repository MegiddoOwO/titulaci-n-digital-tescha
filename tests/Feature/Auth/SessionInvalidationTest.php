<?php

namespace Tests\Feature\Auth;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Audit finding 8: sessions are file-backed and there is no remember token, so a stolen session
 * used to survive a password reset or an admin password change. AuthenticateSession ties each
 * session to the password hash it was created with.
 */
class SessionInvalidationTest extends TestCase
{
    use DatabaseTransactions;

    private function student(): Usuario
    {
        return Usuario::where('numero_control', '2021-0001')->firstOrFail();
    }

    private function signIn(Usuario $usuario, string $password = 'Demo1234!'): void
    {
        $this->post('/login', ['numero_control' => $usuario->numero_control, 'password' => $password])
            ->assertRedirect();
        $this->assertAuthenticatedAs($usuario);
    }

    private function assertSessionRejected(): void
    {
        $this->get('/notificaciones')->assertRedirect('/login');
        $this->getJson('/notificaciones')->assertUnauthorized();
    }

    public function test_session_is_rejected_after_a_password_reset(): void
    {
        $usuario = $this->student();
        $this->signIn($usuario);
        $this->getJson('/notificaciones')->assertOk();

        Usuario::whereKey($usuario->id)->update([
            'reset_token' => hash('sha256', 'reset-token-1'),
            'reset_expira' => now()->addHour(),
        ]);
        $saved = session()->all();

        // The reset is done from another browser (no session).
        $this->flushSession();
        $this->app['auth']->forgetGuards();
        $this->post('/reset-password', [
            'token' => 'reset-token-1', 'password' => 'Nueva12345', 'password_confirmation' => 'Nueva12345',
        ])->assertRedirect('/login');

        // The old browser still holds the original session.
        $this->flushSession();
        $this->app['auth']->forgetGuards();
        $this->withSession($saved);
        $this->assertSessionRejected();
    }

    public function test_session_is_rejected_after_an_admin_changes_the_password(): void
    {
        $usuario = $this->student();
        $this->signIn($usuario);
        $saved = session()->all();

        $admin = Usuario::where('numero_control', 'ADM-0001')->firstOrFail();
        $this->flushSession();
        $this->actingAs($admin)->putJson("/admin/usuarios/{$usuario->id}", ['password' => 'Cambiada123'])
            ->assertOk();
        $this->assertTrue(Hash::check('Cambiada123', $usuario->fresh()->password_hash));

        $this->flushSession();
        $this->app['auth']->forgetGuards();
        $this->withSession($saved);
        $this->assertSessionRejected();
    }

    public function test_unchanged_password_keeps_the_session_working(): void
    {
        $this->signIn($this->student());

        for ($i = 0; $i < 3; $i++) {
            $this->getJson('/notificaciones')->assertOk();
            $this->get('/dashboard')->assertOk();
        }
    }

    public function test_logging_in_again_with_the_new_password_works(): void
    {
        $usuario = $this->student();
        $this->signIn($usuario);
        $saved = session()->all();

        Usuario::whereKey($usuario->id)->update(['password_hash' => Hash::make('Otra123456')]);

        $this->flushSession();
        $this->app['auth']->forgetGuards();
        $this->withSession($saved);
        $this->assertSessionRejected();

        $this->flushSession();
        $this->app['auth']->forgetGuards();
        $this->signIn($usuario, 'Otra123456');
        $this->getJson('/notificaciones')->assertOk();
    }
}
