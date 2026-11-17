<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\PublicContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NormativaController extends Controller
{
    public function __construct(private readonly PublicContentService $content) {}

    public function index(Request $request): JsonResponse
    {
        $modalidad = (int) $request->query('modalidad_id') ?: null;

        return response()->json($this->content->normativa($modalidad));
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->content->normativaItem($id) ?? abort(404, 'Normativa no encontrada.'));
    }
}
