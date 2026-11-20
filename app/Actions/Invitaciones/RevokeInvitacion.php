<?php

namespace App\Actions\Invitaciones;

use App\Models\Invitacion;
use App\Models\Usuario;
use App\Services\BitacoraService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RevokeInvitacion
{
    public function __construct(private readonly BitacoraService $bitacora) {}

    public function execute(Invitacion $invitacion, Usuario $admin): void
    {
        DB::transaction(function () use ($invitacion, $admin) {
            $locked = Invitacion::whereKey($invitacion->id)->lockForUpdate()->firstOrFail();

            if ($locked->estado !== Invitacion::ESTADO_PENDIENTE) {
                throw ValidationException::withMessages([
                    'invitacion' => 'Solo se pueden revocar invitaciones pendientes.',
                ]);
            }

            $locked->update(['revocada_en' => now()]);

            $this->bitacora->log($admin->id, 'invitacion_revocada', 'invitacion', $locked->id, [
                'numero_control' => $locked->numero_control,
            ]);
        });
    }
}
