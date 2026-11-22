<?php

namespace Tests\Feature\Auth;

use App\Mail\ResetPasswordMail;
use App\Models\Consentimiento;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use DatabaseTransactions;

    private const PASSWORD = 'Demo1234!';

    private function userWithRole(string $rol): Usuario
    {
        return Usuario::where('rol', $rol)->where('activo', 1)->orderBy('id')->firstOrFail();
    }

    public function test_seed_hash_is_verifiable_by_laravel_hash(): void
    {
        $this->assertTrue(Hash::check(self::PASSWORD, $this->userWithRole('estudiante')->password_hash));
    }

    public function test_login_redirects_each_role_to_its_landing_page(): void
    {
        foreach (['estudiante' => '/dashboard', 'asesor' => '/asesor', 'administrativo' => '/admin'] as $rol => $path) {
            $user = $this->userWithRole($rol);

            $this->post('/login', ['numero_control' => $user->numero_control, 'password' => self::PASSWORD])
                ->assertRedirect($path);
            $this->assertAuthenticatedAs($user);

            $this->post('/logout');
            $this->assertGuest();
        }
    }

    public function test_wrong_password_returns_uniform_message_without_counter(): void
    {
        $user = $this->userWithRole('estudiante');

        $this->post('/login', ['numero_control' => $user->numero_control, 'password' => 'bad'])
            ->assertSessionHasErrors(['numero_control' => 'Credenciales incorrectas.'])
            ->assertSessionHas('bloqueado', false);

        $this->assertGuest();
        $this->assertSame(1, $user->fresh()->intentos_fallidos);
    }

    public function test_unknown_user_gets_generic_error(): void
    {
        $this->post('/login', ['numero_control' => 'NOPE-999', 'password' => 'x'])
            ->assertSessionHasErrors(['numero_control' => 'Credenciales incorrectas.'])
            ->assertSessionHas('bloqueado', false);
    }

    public function test_failed_login_is_identical_for_existing_and_unknown_users(): void
    {
        $user = $this->userWithRole('estudiante');

        $known = $this->post('/login', ['numero_control' => $user->numero_control, 'password' => 'bad']);
        $unknown = $this->post('/login', ['numero_control' => 'NOPE-999', 'password' => 'bad']);

        $this->assertSame($known->getStatusCode(), $unknown->getStatusCode());
        $known->assertSessionHasErrors(['numero_control' => 'Credenciales incorrectas.']);
        $unknown->assertSessionHasErrors(['numero_control' => 'Credenciales incorrectas.']);
        $this->assertStringNotContainsStringIgnoringCase('restantes', $known->getSession()->get('errors')->first('numero_control'));
    }

    public function test_unknown_user_is_never_told_it_is_locked(): void
    {
        for ($i = 0; $i < 7; $i++) {
            $this->post('/login', ['numero_control' => 'NOPE-999', 'password' => 'bad'])
                ->assertSessionHasErrors(['numero_control' => 'Credenciales incorrectas.'])
                ->assertSessionHas('bloqueado', false);
        }
    }

    public function test_missing_fields_are_rejected(): void
    {
        $this->post('/login', [])->assertSessionHasErrors(['numero_control', 'password']);
    }

    public function test_lockout_after_five_failures_and_locked_user_cannot_login(): void
    {
        $user = $this->userWithRole('estudiante');
        $bad = ['numero_control' => $user->numero_control, 'password' => 'bad'];

        for ($i = 0; $i < 4; $i++) {
            $this->post('/login', $bad)->assertSessionHas('bloqueado', false);
        }

        $this->post('/login', $bad)
            ->assertSessionHasErrors(['numero_control' => 'Cuenta bloqueada por seguridad (15 min). Demasiados intentos fallidos.'])
            ->assertSessionHas('bloqueado', true);

        $this->assertNotNull($user->fresh()->bloqueado_hasta);

        // Even the correct password is refused while locked.
        $this->post('/login', ['numero_control' => $user->numero_control, 'password' => self::PASSWORD])
            ->assertSessionHasErrors(['numero_control' => 'Cuenta bloqueada por seguridad. Intente de nuevo más tarde.'])
            ->assertSessionHas('bloqueado', true);
        $this->assertGuest();
    }

    public function test_expired_lock_is_cleared_and_login_succeeds(): void
    {
        $user = $this->userWithRole('estudiante');
        DB::table('usuarios')->where('id', $user->id)->update([
            'intentos_fallidos' => 5,
            'bloqueado_hasta' => DB::raw('DATE_SUB(NOW(), INTERVAL 1 MINUTE)'),
        ]);

        $this->post('/login', ['numero_control' => $user->numero_control, 'password' => self::PASSWORD])
            ->assertRedirect('/dashboard');

        $fresh = $user->fresh();
        $this->assertSame(0, $fresh->intentos_fallidos);
        $this->assertNull($fresh->bloqueado_hasta);
    }

    public function test_login_page_exposes_lockout_flag(): void
    {
        $this->withSession(['bloqueado' => true])->get('/login')
            ->assertInertia(fn ($page) => $page->component('Auth/Login')->where('bloqueado', true));
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        // The landing page is public for guests (covered in InertiaPagesTest).
    }

    public function test_role_middleware_blocks_wrong_role(): void
    {
        $this->actingAs($this->userWithRole('estudiante'));

        $this->get('/dashboard')->assertOk();
        $this->get('/asesor')->assertForbidden();
        $this->get('/admin')->assertForbidden();
    }

    public function test_each_role_reaches_only_its_page_and_root_redirects_home(): void
    {
        $this->actingAs($this->userWithRole('asesor'));
        $this->get('/asesor')->assertOk();
        $this->get('/dashboard')->assertForbidden();
        $this->get('/')->assertRedirect('/asesor');

        $this->actingAs($this->userWithRole('administrativo'));
        $this->get('/admin')->assertOk();
        $this->get('/')->assertRedirect('/admin');
    }

    public function test_shared_props_expose_user_and_consent_flag(): void
    {
        $user = $this->userWithRole('estudiante');
        Consentimiento::where('usuario_id', $user->id)->delete();

        $this->actingAs($user)->get('/dashboard')->assertInertia(fn ($page) => $page
            ->where('auth.user.numero_control', $user->numero_control)
            ->where('auth.user.rol', 'estudiante')
            ->where('auth.user.nombre_completo', $user->nombre_completo)
            ->where('auth.consentimiento', false)
            ->missing('auth.user.password_hash'));
    }

    public function test_logout_ends_session(): void
    {
        $this->actingAs($this->userWithRole('estudiante'))->post('/logout')->assertRedirect('/');
        $this->assertGuest();
    }

    public function test_forgot_password_sends_mail_and_stores_hashed_token(): void
    {
        Mail::fake();
        $user = $this->userWithRole('estudiante');

        $this->post('/forgot-password', ['numero_control' => $user->numero_control])
            ->assertSessionHas('status', 'Si el número de control existe, recibirás un correo con instrucciones.');

        Mail::assertSent(ResetPasswordMail::class, fn ($m) => $m->hasTo($user->email));
        $stored = $user->fresh();
        $this->assertSame(64, strlen($stored->getRawOriginal('reset_token')));
        $this->assertNotNull($stored->reset_expira);
    }

    public function test_forgot_password_does_not_reveal_unknown_accounts(): void
    {
        Mail::fake();

        $this->post('/forgot-password', ['numero_control' => 'NOPE-999'])
            ->assertSessionHas('status', 'Si el número de control existe, recibirás un correo con instrucciones.');
        Mail::assertNothingSent();
    }

    public function test_reset_password_happy_path_clears_lockout(): void
    {
        $user = $this->userWithRole('estudiante');
        $token = $this->requestToken($user);
        DB::table('usuarios')->where('id', $user->id)->update(['intentos_fallidos' => 5]);

        $this->post('/reset-password', ['token' => $token, 'password' => 'NuevaClave99', 'password_confirmation' => 'NuevaClave99'])
            ->assertRedirect('/login')
            ->assertSessionHas('status', 'Contraseña restablecida correctamente.');

        $fresh = $user->fresh();
        $this->assertNull($fresh->getRawOriginal('reset_token'));
        $this->assertSame(0, $fresh->intentos_fallidos);

        $this->post('/login', ['numero_control' => $user->numero_control, 'password' => 'NuevaClave99'])
            ->assertRedirect('/dashboard');
    }

    public function test_reset_password_rejects_invalid_expired_and_short(): void
    {
        $user = $this->userWithRole('estudiante');
        $valid = ['password' => 'NuevaClave99', 'password_confirmation' => 'NuevaClave99'];

        $this->post('/reset-password', ['token' => 'garbage'] + $valid)
            ->assertSessionHasErrors(['token' => 'Token inválido o expirado.']);

        $token = $this->requestToken($user);
        DB::table('usuarios')->where('id', $user->id)->update(['reset_expira' => DB::raw('DATE_SUB(NOW(), INTERVAL 1 MINUTE)')]);
        $this->post('/reset-password', ['token' => $token] + $valid)
            ->assertSessionHasErrors(['token' => 'Token inválido o expirado.']);

        $this->post('/reset-password', ['token' => $token, 'password' => 'short', 'password_confirmation' => 'short'])
            ->assertSessionHasErrors(['password' => 'La contraseña debe tener al menos 8 caracteres.']);
        $this->assertTrue(Hash::check(self::PASSWORD, $user->fresh()->password_hash));
    }

    public function test_consent_get_and_post(): void
    {
        $user = $this->userWithRole('estudiante');
        Consentimiento::where('usuario_id', $user->id)->delete();
        $this->actingAs($user);

        $this->getJson('/privacidad/consentimiento')->assertOk()->assertExactJson(['consentido' => false]);

        $this->postJson('/privacidad/consentimiento')
            ->assertOk()->assertJson(['message' => 'Consentimiento registrado correctamente.']);

        $this->getJson('/privacidad/consentimiento')
            ->assertOk()->assertJson(['consentido' => true, 'version' => '1.0']);
        $this->assertSame(1, Consentimiento::where('usuario_id', $user->id)->count());
    }

    public function test_consent_requires_authentication(): void
    {
        $this->getJson('/privacidad/consentimiento')->assertUnauthorized();
    }

    private function requestToken(Usuario $user): string
    {
        Mail::fake();
        $this->post('/forgot-password', ['numero_control' => $user->numero_control]);

        $token = null;
        Mail::assertSent(ResetPasswordMail::class, function (ResetPasswordMail $mail) use (&$token) {
            preg_match('#/reset-password/([0-9a-f]{64})#', $mail->resetLink, $m);
            $token = $m[1];

            return true;
        });

        return $token;
    }
}
