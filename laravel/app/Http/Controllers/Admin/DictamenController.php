<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\EmitirDictamen;
use App\Contracts\DictamenPdfRenderer;
use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDictamenRequest;
use App\Models\Dictamen;
use App\Services\Admin\ExpedienteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

class DictamenController extends Controller
{
    use RespondsInertiaOrJson;

    /** Emission page: expedientes that can still receive a dictamen (aprobado / en_revision). */
    public function index(ExpedienteService $expedientes): InertiaResponse
    {
        $candidatos = collect($expedientes->list(null, null, 1, 100)['expedientes'])
            ->whereIn('estatus', ['aprobado', 'en_revision'])
            ->values()
            ->all();

        return Inertia::render('Admin/Dictamenes', ['candidatos' => $candidatos]);
    }

    public function store(StoreDictamenRequest $request, EmitirDictamen $emitir): JsonResponse|RedirectResponse
    {
        $emitir->execute(
            (int) $request->validated('tramite_id'),
            $request->validated('resultado'),
            (string) ($request->validated('observaciones') ?? ''),
            $request->user(),
        );

        return $this->mutated($request, 'Dictamen emitido correctamente.');
    }

    public function pdf(int $tramite, DictamenPdfRenderer $renderer): Response
    {
        $dictamen = Dictamen::where('tramite_id', $tramite)->first() ?? abort(404, 'Dictamen no encontrado.');

        return $renderer->render($dictamen);
    }
}
