<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateAsignacion;
use App\Actions\Admin\ReplaceAsesorAsignacion;
use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReplaceAsesorRequest;
use App\Http\Requests\Admin\StoreAsignacionRequest;
use App\Models\Asignacion;
use App\Models\Tramite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AsignacionController extends Controller
{
    use RespondsInertiaOrJson;

    public function store(StoreAsignacionRequest $request, CreateAsignacion $create): JsonResponse|RedirectResponse
    {
        $create->execute(
            (int) $request->validated('tramite_id'),
            (int) $request->validated('usuario_id'),
            $request->validated('rol_asignacion'),
        );

        return $this->mutated($request, 'Asignación creada.');
    }

    public function replaceAsesor(ReplaceAsesorRequest $request, int $tramite, ReplaceAsesorAsignacion $replace): JsonResponse|RedirectResponse
    {
        Tramite::whereKey($tramite)->exists() || abort(404, 'Trámite no encontrado.');

        $usuarioId = $request->validated('usuario_id');
        $replace->execute($tramite, $usuarioId === null ? null : (int) $usuarioId);

        return $this->mutated($request, $usuarioId === null ? 'Asesor removido.' : 'Asesor actualizado.');
    }

    public function destroy(Request $request, int $asignacion): JsonResponse|RedirectResponse
    {
        // Faithful: Express answers success even when the id does not exist.
        Asignacion::whereKey($asignacion)->delete();

        return $this->mutated($request, 'Asignación eliminada.');
    }
}
