<?php

namespace App\Actions\Admin;

use App\Models\Asignacion;
use App\Models\VwCargaDocente;
use Illuminate\Validation\ValidationException;

/**
 * Port of POST /api/admin/asignaciones. The load rule reads vw_carga_docente (active asesores
 * only; every assignment counts, whatever its role) and `carga_maxima` falls back to 5.
 * Duplicates are ignored silently, like Express' INSERT IGNORE.
 */
class CreateAsignacion
{
    public const DEFAULT_MAX_LOAD = 5;

    public function execute(int $tramiteId, int $usuarioId, string $rol): Asignacion
    {
        $this->assertWithinLoad($usuarioId);

        return Asignacion::firstOrCreate([
            'tramite_id' => $tramiteId,
            'usuario_id' => $usuarioId,
            'rol_asignacion' => $rol,
        ]);
    }

    /**
     * The load rule, shared with ReplaceAsesorAsignacion and the bulk invitation validator.
     * `$pending` counts students already promised to this asesor but not assigned yet.
     */
    public function assertWithinLoad(int $usuarioId, int $pending = 0): void
    {
        $carga = VwCargaDocente::find($usuarioId);

        if ($carga && $carga->carga_actual + $pending >= ($carga->carga_maxima ?: self::DEFAULT_MAX_LOAD)) {
            throw ValidationException::withMessages([
                'usuario_id' => 'El docente ha alcanzado su carga máxima de asesorías.',
            ]);
        }
    }
}
