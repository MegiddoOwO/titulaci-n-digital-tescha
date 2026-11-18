<?php

namespace App\Services;

use App\Models\Bitacora;
use Illuminate\Support\Facades\DB;

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

    /**
     * Port of GET /api/admin/bitacora (no filters in Express, only pagination, newest first).
     *
     * @return array{rows: array<int, array<string, mixed>>, total: int, page: int, totalPages: int}
     */
    public function paginate(int $page, int $limit): array
    {
        $total = DB::table('bitacora')->count();

        $rows = DB::table('bitacora as b')
            ->leftJoin('usuarios as u', 'b.usuario_id', '=', 'u.id')
            ->orderByDesc('b.fecha')->orderByDesc('b.id')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->selectRaw("b.id, b.accion, b.entidad, b.entidad_id, b.detalle, b.ip_origen, b.fecha,
                CONCAT(u.nombre, ' ', u.apellido_paterno) AS usuario_nombre")
            ->get()
            ->map(fn ($r) => ['detalle' => $r->detalle === null ? null : json_decode($r->detalle, true)] + (array) $r)
            ->all();

        return ['rows' => $rows, 'total' => $total, 'page' => $page, 'totalPages' => (int) ceil($total / $limit)];
    }
}
