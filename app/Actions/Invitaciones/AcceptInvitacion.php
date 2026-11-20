<?php

namespace App\Actions\Invitaciones;

use App\Actions\Admin\CreateUsuario;
use App\Models\Invitacion;
use App\Models\Usuario;
use App\Services\BitacoraService;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Public step: the invitee chooses a password and the account is created from the invitation's
 * data through the same CreateUsuario action the admin uses. Single use is enforced by a row
 * lock plus a conditional update, so a double submit creates one account.
 */
class AcceptInvitacion
{
    public function __construct(
        private readonly CreateUsuario $createUsuario,
        private readonly BitacoraService $bitacora,
    ) {}

    /** @return Usuario|null null when the link is not usable (one generic outcome, no detail leaked) */
    public function execute(string $token, string $password): ?Usuario
    {
        return DB::transaction(function () use ($token, $password) {
            $invitacion = Invitacion::where('token_hash', Invitacion::hashToken($token))
                ->lockForUpdate()
                ->first();

            if (! $invitacion || $invitacion->estado !== Invitacion::ESTADO_PENDIENTE) {
                return null;
            }

            $taken = Usuario::where('numero_control', $invitacion->numero_control)
                ->orWhere('email', $invitacion->email)
                ->exists();
            if ($taken) {
                return null;
            }

            $usuario = $this->createUsuario->execute([
                'numero_control' => $invitacion->numero_control,
                'email' => $invitacion->email,
                'password' => $password,
                'nombre' => $invitacion->nombre,
                'apellido_paterno' => $invitacion->apellido_paterno,
                'apellido_materno' => $invitacion->apellido_materno,
                'rol' => $invitacion->rol,
                'grado_academico' => $invitacion->grado_academico,
                'carga_maxima' => $invitacion->carga_maxima,
                'opcion_titulacion_id' => $invitacion->opcion_titulacion_id,
                'asesor_id' => $invitacion->asesor_id,
            ]);

            $updated = Invitacion::whereKey($invitacion->id)->whereNull('aceptada_en')->update([
                'aceptada_en' => now(),
                'usuario_id' => $usuario->id,
            ]);
            if ($updated !== 1) {
                throw new RuntimeException('Invitation was accepted concurrently.');
            }

            $this->bitacora->log($usuario->id, 'invitacion_aceptada', 'invitacion', $invitacion->id, [
                'numero_control' => $usuario->numero_control,
                'rol' => $usuario->rol,
            ]);

            return $usuario;
        });
    }
}
