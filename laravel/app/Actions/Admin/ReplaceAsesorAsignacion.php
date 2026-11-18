<?php

namespace App\Actions\Admin;

use App\Models\Asignacion;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Replaces the tramite's asesor assignment (or removes it when $usuarioId is null) in one
 * transaction, so a failed load check keeps the previous asesor. Only asesor-role rows are
 * touched; sinodales and revisores stay as they are.
 *
 * @return string 'updated' | 'removed'
 */
class ReplaceAsesorAsignacion
{
    public function __construct(private readonly CreateAsignacion $create) {}

    public function execute(int $tramiteId, ?int $usuarioId): string
    {
        return DB::transaction(function () use ($tramiteId, $usuarioId) {
            $current = Asignacion::where('tramite_id', $tramiteId)
                ->where('rol_asignacion', 'asesor')
                ->lockForUpdate()
                ->get();

            if ($usuarioId === null) {
                Asignacion::whereKey($current->modelKeys())->delete();

                return 'removed';
            }

            $asesor = Usuario::where('rol', Usuario::ROL_ASESOR)->where('activo', true)->find($usuarioId);
            if (! $asesor) {
                throw ValidationException::withMessages([
                    'usuario_id' => 'El usuario seleccionado no es un asesor activo.',
                ]);
            }

            // Same asesor only: nothing to do.
            if ($current->count() === 1 && $current->first()->usuario_id === $asesor->id) {
                return 'updated';
            }

            Asignacion::whereKey($current->modelKeys())->delete();
            $this->create->execute($tramiteId, $asesor->id, 'asesor');

            return 'updated';
        });
    }
}
