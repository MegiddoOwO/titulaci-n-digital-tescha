<?php

namespace App\Services\Admin;

use App\Models\Dictamen;
use App\Models\Documento;
use App\Models\Tramite;

/**
 * Port of AdminRepository.getStats.
 */
class AdminStatsService
{
    /**
     * @return array<string, mixed>
     */
    public function stats(): array
    {
        $byStatus = Tramite::query()
            ->where('activo', 1)
            ->selectRaw('estatus, COUNT(*) AS cnt')
            ->groupBy('estatus')
            ->pluck('cnt', 'estatus');

        $count = fn (string $status) => (int) ($byStatus[$status] ?? 0);

        return [
            'total_activos' => Tramite::where('activo', 1)->count(),
            'pendientes_revision' => Documento::whereIn('estatus', ['cargado', 'en_revision'])->count(),
            'dictamenes_emitidos' => Dictamen::count(),
            'en_proceso' => $count('en_proceso') + $count('en_revision'),
            'por_estatus' => [
                'en_proceso' => $count('en_proceso'),
                'en_revision' => $count('en_revision'),
                'aprobado' => $count('aprobado'),
                'rechazado' => $count('rechazado'),
                'completado' => $count('completado'),
            ],
        ];
    }
}
