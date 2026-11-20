<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/**
 * Unnamed `throttle:max,decay` middleware derives its key from the IP alone, so routes with
 * different limits used to share one counter. Each throttled route now has its own prefix.
 */
class ThrottleIsolationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_exhausting_forgot_password_does_not_throttle_login_or_invitations(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->post(route('password.email'), ['numero_control' => 'ZZ-9999']);
        }

        $this->post(route('password.email'), ['numero_control' => 'ZZ-9999'])->assertStatus(429);

        $this->post(route('login'), ['numero_control' => 'ZZ-9999', 'password' => 'incorrecta'])
            ->assertStatus(302);

        $this->post(route('invitacion.aceptar', ['token' => str_repeat('a', 64)]), [
            'password' => 'Clave1234!',
            'password_confirmation' => 'Clave1234!',
        ])->assertStatus(302);
    }

    public function test_exhausting_invitation_acceptance_does_not_throttle_login(): void
    {
        $token = str_repeat('b', 64);

        for ($i = 0; $i < 10; $i++) {
            $this->post(route('invitacion.aceptar', ['token' => $token]), [
                'password' => 'Clave1234!',
                'password_confirmation' => 'Clave1234!',
            ]);
        }

        $this->post(route('invitacion.aceptar', ['token' => $token]), [
            'password' => 'Clave1234!',
            'password_confirmation' => 'Clave1234!',
        ])->assertStatus(429);

        $this->post(route('login'), ['numero_control' => 'ZZ-9999', 'password' => 'incorrecta'])
            ->assertStatus(302);
    }
}
