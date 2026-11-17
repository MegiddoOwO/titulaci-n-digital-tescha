<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Services\PublicContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NormativaController extends Controller
{
    use RespondsInertiaOrJson;

    public function __construct(private readonly PublicContentService $content) {}

    public function index(Request $request): JsonResponse|Response
    {
        $modalidad = (int) $request->query('modalidad_id') ?: null;
        $items = $this->content->normativa($modalidad);

        if ($this->wantsPlainJson($request)) {
            return response()->json($items);
        }

        return Inertia::render('Normativa', [
            'normativa' => $items,
            'modalidadId' => $modalidad,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->content->normativaItem($id) ?? abort(404, 'Normativa no encontrada.'));
    }
}
