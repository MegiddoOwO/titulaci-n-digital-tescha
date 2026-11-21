<?php

namespace Tests\Feature\Auth;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class UsuarioMassAssignmentTest extends TestCase
{
    use DatabaseTransactions;

    public function test_role_and_security_fields_are_guarded(): void
    {
        $usuario = (new Usuario)->fill([
            'nombre' => 'Mallory',
            'rol' => 'administrativo',
            'activo' => false,
            'intentos_fallidos' => 3,
            'bloqueado_hasta' => now(),
            'reset_token' => 'abc',
            'reset_expira' => now(),
        ]);

        $this->assertSame('Mallory', $usuario->nombre);

        foreach (['rol', 'activo', 'intentos_fallidos', 'bloqueado_hasta', 'reset_token', 'reset_expira'] as $field) {
            $this->assertNull($usuario->getAttribute($field), "{$field} must not be mass assignable");
        }
    }
}
