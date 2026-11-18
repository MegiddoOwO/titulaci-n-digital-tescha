<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResolveSolicitudArcoRequest;
use App\Models\SolicitudArco;
use App\Services\SolicitudArcoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SolicitudArcoController extends Controller
{
    use RespondsInertiaOrJson;

    public function __construct(private readonly SolicitudArcoService $arco) {}

    public function page(): Response
    {
        return Inertia::render('Admin/Arco', ['solicitudes' => $this->arco->all()]);
    }

    public function index(): JsonResponse
    {
        return response()->json($this->arco->all());
    }

    public function update(ResolveSolicitudArcoRequest $request, int $solicitud): JsonResponse|RedirectResponse
    {
        $model = SolicitudArco::find($solicitud) ?? abort(404, 'Solicitud no encontrada.');
        $this->arco->resolve($model, $request->validated('estado'), $request->validated('respuesta'));

        return $this->mutated($request, 'Solicitud actualizada.');
    }
}
