<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListExpedientesRequest;
use App\Http\Requests\Admin\UpdateExpedienteRequest;
use App\Models\Tramite;
use App\Services\Admin\ExpedienteService;
use App\Services\Admin\ExpedienteExporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Inertia\Response;

class ExpedienteController extends Controller
{
    use RespondsInertiaOrJson;

    public function __construct(private readonly ExpedienteService $expedientes) {}

    public function index(ListExpedientesRequest $request): Response|JsonResponse
    {
        $result = $this->expedientes->list(
            $request->query('search') ?: null,
            $request->query('estatus') ?: null,
            $request->page(),
            $request->limit(),
            $request->activo(),
        );

        if ($this->wantsPlainJson($request)) {
            return response()->json($result);
        }

        return Inertia::render('Admin/Expedientes/Index', $result + [
            'filters' => $request->only('search', 'estatus', 'activo'),
        ]);
    }

    public function export(Request $request, ExpedienteExporter $exporter): StreamedResponse
    {
        return $exporter->csv($request->query('search') ?: null, $request->query('estatus') ?: null);
    }

    public function download(int $tramite, ExpedienteExporter $exporter): BinaryFileResponse
    {
        return $exporter->zip($tramite);
    }

    public function show(Request $request, int $tramite): Response|JsonResponse
    {
        $detail = $this->expedientes->detail(
            // Cancelled tramites stay viewable so the admin can review and reactivate them.
            $this->expedientes->find($tramite, onlyActive: false) ?? abort(404, 'Trámite no encontrado.'),
        );

        if ($this->wantsPlainJson($request)) {
            return response()->json($detail);
        }

        return Inertia::render('Admin/Expedientes/Show', ['tramite' => $detail]);
    }

    public function update(UpdateExpedienteRequest $request, int $tramite): JsonResponse|RedirectResponse
    {
        $this->expedientes->update($this->activeOrFail($tramite), $request->validated());

        return $this->mutated($request, 'Trámite actualizado.');
    }

    public function toggle(Request $request, int $tramite): JsonResponse|RedirectResponse
    {
        $model = $this->expedientes->find($tramite, onlyActive: false) ?? abort(404, 'Trámite no encontrado.');
        $activo = $this->expedientes->toggle($model);

        return $this->mutated(
            $request,
            $activo ? 'Trámite reactivado.' : 'Trámite cancelado.',
            ['activo' => $activo],
        );
    }

    private function activeOrFail(int $id): Tramite
    {
        return $this->expedientes->find($id) ?? abort(404, 'Trámite no encontrado.');
    }
}
