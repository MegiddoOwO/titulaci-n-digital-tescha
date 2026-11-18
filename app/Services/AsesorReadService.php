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

    /**
     * Additive dashboard data (Inertia only): documents waiting for review and rejected documents
     * per assigned tramite, using the same assignment scope as `estudiantes()`.
     *
     * @param  array<int, array<string, mixed>>  $estudiantes  result of `estudiantes()`
     * @return array<int, array{tramite_id: int, por_revisar: int, rechazados: int}>
     */
    public function revision(array $estudiantes): array
    {
        $ids = array_column($estudiantes, 'tramite_id');
        if ($ids === []) {
            return [];
        }

        $rows = DB::table('documentos')
            ->whereIn('tramite_id', $ids)
            ->groupBy('tramite_id')
            ->selectRaw("tramite_id,
                SUM(estatus IN ('cargado', 'en_revision')) AS por_revisar,
                SUM(estatus = 'rechazado') AS rechazados")
            ->get()
            ->keyBy('tramite_id');

        return array_map(fn (int $id) => [
            'tramite_id' => $id,
            'por_revisar' => (int) ($rows[$id]->por_revisar ?? 0),
            'rechazados' => (int) ($rows[$id]->rechazados ?? 0),
        ], $ids);
    }

    /**
     * Load of the asesor against their limit: `vw_carga_docente` (what the admin assignment guard
     * uses) with the user's own `carga_maxima` as fallback when the view has no row for them.
     *
     * @return array{actual: int, maxima: int|null}
     */
    public function carga(int $asesorId, int $fallbackActual): array
    {
        $row = DB::table('vw_carga_docente')->where('docente_id', $asesorId)->first();

        if ($row) {
            return [
                'actual' => (int) $row->carga_actual,
                'maxima' => $row->carga_maxima !== null ? (int) $row->carga_maxima : null,
            ];
        }

        $maxima = DB::table('usuarios')->where('id', $asesorId)->value('carga_maxima');

        return ['actual' => $fallbackActual, 'maxima' => $maxima !== null ? (int) $maxima : null];
    }
}
