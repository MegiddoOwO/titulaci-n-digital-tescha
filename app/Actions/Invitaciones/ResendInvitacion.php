<?php

namespace App\Actions\Invitaciones;

use App\Models\Invitacion;
use App\Models\Usuario;
use App\Services\BitacoraService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Issues a new token and expiry for a pending or expired invitation; the old link stops working. */
class ResendInvitacion
{
    public function __construct(private readonly BitacoraService $bitacora) {}

    /** @return string the new plain link (shown once) */
    public function execute(Invitacion $invitacion, Usuario $admin): string
    {
        $token = bin2hex(random_bytes(32));

        DB::transaction(function () use ($invitacion, $token, $admin) {
            $locked = Invitacion::whereKey($invitacion->id)->lockForUpdate()->firstOrFail();

            if (! in_array($locked->estado, [Invitacion::ESTADO_PENDIENTE, Invitacion::ESTADO_EXPIRADA], true)) {
                throw ValidationException::withMessages([
                    'invitacion' => 'Solo se pueden reenviar invitaciones pendientes o expiradas.',
                ]);
            }

            CreateInvitacion::assertAvailable($locked->numero_control, $locked->email, $locked->id);

            $locked->update([
                'token_hash' => Invitacion::hashToken($token),
                'expira_en' => now()->addHours(CreateInvitacion::hours()),
            ]);

            $this->bitacora->log($admin->id, 'invitacion_reenviada', 'invitacion', $locked->id, [
                'numero_control' => $locked->numero_control,
            ]);

            $invitacion->setRawAttributes($locked->getAttributes(), true);
        });

        $link = route('invitacion.show', $token);
        CreateInvitacion::deliver($invitacion, $link);

        return $link;
    }
}
