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
    public const MSG_INVALID = 'Credenciales incorrectas.';
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
            if ($this->registerFailure($usuario->id, $max, $minutes)) {
                return $this->fail(
                    "Cuenta bloqueada por seguridad ({$minutes} min). Demasiados intentos fallidos.",
                    locked: true,
                );
            }

            return $this->fail(self::MSG_INVALID);
        }

        $this->resetAttempts($usuario->id);

        return ['user' => $usuario, 'error' => null, 'locked' => false];
    }

    /**
     * Atomically counts one failure and arms the lock when the threshold is reached.
     * bloqueado_hasta is assigned before the counter so it sees the pre-increment value
     * (MySQL/MariaDB evaluate SET assignments left to right). Returns whether the account is now locked.
     */
    private function registerFailure(int $id, int $max, int $minutes): bool
    {
        DB::update(
            'UPDATE usuarios SET
                bloqueado_hasta = IF(intentos_fallidos + 1 >= ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), bloqueado_hasta),
                intentos_fallidos = intentos_fallidos + 1
             WHERE id = ?',
            [$max, $minutes, $id],
        );

        return Usuario::whereKey($id)->where('bloqueado_hasta', '>', DB::raw('NOW()'))->exists();
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
