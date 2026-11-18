<?php

namespace App\Services\Admin;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Read model behind the admin "Resumen" board: lamp counts per trámite status, the weekly
 * series of reviewed documents and the trámites that still need action. Additive to
 * AdminStatsService: the `GET /admin/stats` contract is untouched.
 */
class AdminTableroService
{
    public const STATUSES = ['en_proceso', 'en_revision', 'aprobado', 'rechazado', 'completado'];

    private const WEEKS = 8;

    private const ACTION_ROWS = 10;

    /**
     * @return array{
     *     estatus: array<int, array{estatus: string, total: int, rojo: int, ambar: int, verde: int}>,
     *     semanal: array<int, array{semana: string, documentos: int}>,
     *     pendientes: array{total: int, filas: array<int, array<string, mixed>>}
     * }
     */
    public function tablero(?CarbonImmutable $now = null): array
    {
        $now ??= CarbonImmutable::now();

        return [
            'estatus' => $this->lampsPerStatus(),
            'semanal' => $this->weeklyReviewed($now),
            'pendientes' => $this->pendingActions(),
        ];
    }

    /** Active trámites of students joined with the semáforo computed by the view. */
    private function activeQuery()
    {
        return DB::table('tramites as t')
            ->join('usuarios as u', 't.usuario_id', '=', 'u.id')
            ->leftJoin('vw_progreso_tramite as v', 't.id', '=', 'v.tramite_id')
            ->where('t.activo', 1)
            ->where('u.rol', 'estudiante');
    }

    /**
     * @return array<int, array{estatus: string, total: int, rojo: int, ambar: int, verde: int}>
     */
    private function lampsPerStatus(): array
    {
        $rows = $this->activeQuery()
            ->selectRaw("t.estatus, COALESCE(v.color_semaforo, 'ambar') AS semaforo, COUNT(*) AS cnt")
            ->groupBy('t.estatus', 'semaforo')
            ->get();

        $out = [];
        foreach (self::STATUSES as $status) {
            $out[$status] = ['estatus' => $status, 'total' => 0, 'rojo' => 0, 'ambar' => 0, 'verde' => 0];
        }

        foreach ($rows as $row) {
            if (! isset($out[$row->estatus]) || ! in_array($row->semaforo, ['rojo', 'ambar', 'verde'], true)) {
                continue;
            }
            $out[$row->estatus][$row->semaforo] += (int) $row->cnt;
            $out[$row->estatus]['total'] += (int) $row->cnt;
        }

        return array_values($out);
    }

    /**
     * Documents reviewed per ISO week (Monday start) over the last 8 weeks, oldest first, empty
     * weeks as 0.
     *
     * @return array<int, array{semana: string, documentos: int}>
     */
    private function weeklyReviewed(CarbonImmutable $now): array
    {
        $firstWeek = $now->startOfWeek()->subWeeks(self::WEEKS - 1);

        $dates = DB::table('documentos')
            ->whereNotNull('fecha_revision')
            ->where('fecha_revision', '>=', $firstWeek->toDateTimeString())
            ->pluck('fecha_revision');

        $buckets = [];
        for ($i = 0; $i < self::WEEKS; $i++) {
            $buckets[$firstWeek->addWeeks($i)->toDateString()] = 0;
        }

        foreach ($dates as $date) {
            $key = CarbonImmutable::parse($date)->startOfWeek()->toDateString();
            if (isset($buckets[$key])) {
                $buckets[$key]++;
            }
        }

        $series = [];
        foreach ($buckets as $week => $count) {
            $series[] = ['semana' => $week, 'documentos' => $count];
        }

        return $series;
    }

    /**
     * Trámites with a rejected document or one still pending, loaded or in review; red first.
     *
     * @return array{total: int, filas: array<int, array<string, mixed>>}
     */
    private function pendingActions(): array
    {
        $query = $this->activeQuery()
            ->whereRaw('(COALESCE(v.docs_rechazados, 0) + COALESCE(v.docs_pendientes, 0)
                + COALESCE(v.docs_cargados, 0) + COALESCE(v.docs_en_revision, 0)) > 0');

        $total = (clone $query)->count();

        $filas = $query
            ->orderByRaw("CASE WHEN COALESCE(v.docs_rechazados, 0) > 0 THEN 0 ELSE 1 END")
            ->orderByDesc('t.fecha_actualizacion')
            ->orderBy('t.id')
            ->limit(self::ACTION_ROWS)
            ->selectRaw("t.id, u.numero_control,
                CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_completo,
                t.estatus,
                COALESCE(v.color_semaforo, 'ambar') AS color_semaforo,
                COALESCE(v.docs_rechazados, 0) AS docs_rechazados,
                (COALESCE(v.docs_pendientes, 0) + COALESCE(v.docs_cargados, 0)
                    + COALESCE(v.docs_en_revision, 0)) AS docs_pendientes")
            ->get()
            ->map(fn ($r) => [
                'id' => (int) $r->id,
                'numero_control' => $r->numero_control,
                'nombre_completo' => $r->nombre_completo,
                'estatus' => $r->estatus,
                'color_semaforo' => $r->color_semaforo,
                'docs_rechazados' => (int) $r->docs_rechazados,
                'docs_pendientes' => (int) $r->docs_pendientes,
            ])
            ->all();

        return ['total' => $total, 'filas' => $filas];
    }
}
