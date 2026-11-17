<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Requests\Arco\StoreSolicitudArcoRequest;
use App\Services\SolicitudArcoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Data-subject (ARCO) requests of the logged-in user, any role.
 */
class SolicitudArcoController extends Controller
{
    use RespondsInertiaOrJson;

    public function __construct(private readonly SolicitudArcoService $arco) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->arco->forUser($request->user()->id));
    }

    public function store(StoreSolicitudArcoRequest $request): JsonResponse|RedirectResponse
    {
        $this->arco->create($request->user()->id, $request->validated('tipo'), $request->validated('detalle'));

        return $this->mutated($request, 'Solicitud ARCO registrada. Será procesada en un máximo de 15 días hábiles.');
    }
}
