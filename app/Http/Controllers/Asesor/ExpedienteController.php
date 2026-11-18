<?php

namespace App\Http\Controllers\Asesor;

use App\Http\Controllers\Controller;
use App\Models\Tramite;
use App\Services\Admin\ExpedienteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/**
 * Deliberate addition (not in Express): read-only expediente detail for an asesor, limited to
 * the tramites they are assigned to. Reuses the admin detail shape the asesor page expects.
 */
class ExpedienteController extends Controller
{
    public function show(int $tramite, ExpedienteService $expedientes): JsonResponse
    {
        $model = $expedientes->find($tramite) ?? abort(404, 'Trámite no encontrado.');

        Gate::authorize('viewAsAsesor', $model);

        return response()->json($expedientes->detail($model));
    }
}
