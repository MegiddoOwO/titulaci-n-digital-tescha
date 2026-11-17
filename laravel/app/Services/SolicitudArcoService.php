<?php

namespace App\Services;

use App\Models\SolicitudArco;
use Illuminate\Support\Facades\DB;

/**
 * Port of arco.routes.ts and the admin ARCO endpoints. Express writes neither bitacora nor
 * notification rows for ARCO requests and leaves `atendido_por` empty; kept as-is.
 */
class SolicitudArcoService
{
    public function create(int $usuarioId, string $tipo, ?string $detalle): SolicitudArco
    {
        return SolicitudArco::create([
            'usuario_id' => $usuarioId,
            'tipo' => $tipo,
            'estado' => 'pendiente',
            'detalle_solicitud' => $detalle ?: null,
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function forUser(int $usuarioId): array
    {
        return DB::table('solicitudes_arco')
            ->where('usuario_id', $usuarioId)
            ->orderByDesc('fecha_solicitud')->orderByDesc('id')
            ->get(['id', 'tipo', 'estado', 'detalle_solicitud', 'respuesta', 'fecha_solicitud', 'fecha_resolucion'])
            ->map(fn ($r) => (array) $r)
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(): array
    {
        return DB::table('solicitudes_arco as sa')
            ->join('usuarios as u', 'sa.usuario_id', '=', 'u.id')
            ->orderByDesc('sa.fecha_solicitud')->orderByDesc('sa.id')
            ->selectRaw("sa.id, sa.tipo, sa.estado, sa.detalle_solicitud, sa.respuesta, sa.fecha_solicitud,
                sa.fecha_resolucion, u.numero_control, CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_completo")
            ->get()
            ->map(fn ($r) => (array) $r)
            ->all();
    }

    public function resolve(SolicitudArco $solicitud, string $estado, ?string $respuesta): void
    {
        $solicitud->update([
            'estado' => $estado,
            'respuesta' => $respuesta ?: null,
            'fecha_resolucion' => now(),
        ]);
    }
}
