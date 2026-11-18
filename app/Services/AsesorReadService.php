<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Port of GET /api/asesor/estudiantes. Faithful: every assignment of the asesor counts
 * (any role, active or not) as long as the tramite is active.
 */
class AsesorReadService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function estudiantes(int $asesorId): array
    {
        return DB::table('asignaciones as a')
            ->join('tramites as t', fn ($j) => $j->on('a.tramite_id', '=', 't.id')->where('t.activo', 1))
            ->join('usuarios as u', 't.usuario_id', '=', 'u.id')
            ->join('opciones_titulacion as o', 't.opcion_titulacion_id', '=', 'o.id')
            ->leftJoin('vw_progreso_tramite as v', 't.id', '=', 'v.tramite_id')
            ->where('a.usuario_id', $asesorId)
            ->orderByDesc('t.fecha_actualizacion')
            ->selectRaw("t.id AS tramite_id,
                u.numero_control,
                CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_completo,
                o.nombre AS opcion_titulacion,
                t.estatus AS estatus_tramite,
                a.rol_asignacion AS rol_asignacion,
                COALESCE(v.porcentaje_avance, 0) AS porcentaje,
                COALESCE(v.color_semaforo, 'ambar') AS color_semaforo")
            ->get()
            ->map(fn ($r) => array_merge((array) $r, ['porcentaje' => (float) $r->porcentaje]))
            ->all();
    }
}
