<?php

namespace App\Services;

use App\Models\Notificacion;

/**
 * Port of NotificacionService.create (server/src/infrastructure/services/NotificacionService.ts).
 *
 * T6 will add the e-mail delivery for `tipo` email|ambos; for now only the in-app row is stored.
 */
class NotificacionService
{
    public function create(int $usuarioId, string $titulo, string $mensaje, string $tipo = 'in_app', ?int $tramiteId = null): Notificacion
    {
        return Notificacion::create([
            'usuario_id' => $usuarioId,
            'tipo' => $tipo,
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'tramite_id' => $tramiteId,
        ]);
    }
}
