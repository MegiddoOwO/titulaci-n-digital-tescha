<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateAsignacion;
use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAsignacionRequest;
use App\Models\Asignacion;
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

    public function destroy(Request $request, int $asignacion): JsonResponse|RedirectResponse
    {
        // Faithful: Express answers success even when the id does not exist.
        Asignacion::whereKey($asignacion)->delete();

        return $this->mutated($request, 'Asignación eliminada.');
    }
}
