<?php

namespace App\Services;

use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Credential check with DB-backed lockout, ported from the Express login use case.
 * Uses the DB clock (NOW()) so it stays compatible with the legacy API.
 */
class LoginAttemptService
{
    public const MSG_INVALID = 'Número de control o contraseña incorrectos.';
    public const MSG_LOCKED = 'Cuenta bloqueada por seguridad. Intente de nuevo más tarde.';

    /**
     * @return array{user: ?Usuario, error: ?string, locked: bool}
     */
    public function attempt(string $numeroControl, string $password): array
    {
        $max = (int) config('auth.lockout.max_attempts');
        $minutes = (int) config('auth.lockout.block_minutes');

        $usuario = Usuario::where('numero_control', $numeroControl)->where('activo', 1)->first();

        if (! $usuario) {
            return $this->fail(self::MSG_INVALID);
        }

        if ($this->isLocked($usuario)) {
            return $this->fail(self::MSG_LOCKED, locked: true);
        }

        if (! Hash::check($password, (string) $usuario->password_hash)) {
            Usuario::whereKey($usuario->id)->increment('intentos_fallidos');
            $attempts = (int) Usuario::whereKey($usuario->id)->value('intentos_fallidos');

            if ($attempts >= $max) {
                Usuario::whereKey($usuario->id)->update([
                    'bloqueado_hasta' => DB::raw('DATE_ADD(NOW(), INTERVAL '.$minutes.' MINUTE)'),
                ]);

                return $this->fail(
                    "Cuenta bloqueada por seguridad ({$minutes} min). Demasiados intentos fallidos.",
                    locked: true,
                );
            }

            return $this->fail(self::MSG_INVALID.' Intentos restantes: '.($max - $attempts).'.');
        }

        $this->resetAttempts($usuario->id);

        return ['user' => $usuario, 'error' => null, 'locked' => false];
    }

    private function isLocked(Usuario $usuario): bool
    {
        if ($usuario->bloqueado_hasta === null) {
            return false;
        }

        $stillLocked = Usuario::whereKey($usuario->id)
            ->where('bloqueado_hasta', '>', DB::raw('NOW()'))
            ->exists();

        if (! $stillLocked) {
            $this->resetAttempts($usuario->id); // expired lock is cleared, as in Express
        }

        return $stillLocked;
    }

    private function resetAttempts(int $id): void
    {
        Usuario::whereKey($id)->update(['intentos_fallidos' => 0, 'bloqueado_hasta' => null]);
    }

    /** @return array{user: null, error: string, locked: bool} */
    private function fail(string $error, bool $locked = false): array
    {
        return ['user' => null, 'error' => $error, 'locked' => $locked];
    }
}
