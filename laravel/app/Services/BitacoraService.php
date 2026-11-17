<?php

namespace App\Services;

use App\Models\Bitacora;

/**
 * Port of BitacoraService.log. Express never passed the origin IP from these call sites,
 * so `ip_origen` stays null unless a caller supplies it.
 */
class BitacoraService
{
    /**
     * @param  array<string, mixed>|null  $detalle
     */
    public function log(int $usuarioId, string $accion, string $entidad, ?int $entidadId = null, ?array $detalle = null, ?string $ip = null): Bitacora
    {
        return Bitacora::create([
            'usuario_id' => $usuarioId,
            'accion' => $accion,
            'entidad' => $entidad,
            'entidad_id' => $entidadId,
            'detalle' => $detalle,
            'ip_origen' => $ip,
        ]);
    }
}
