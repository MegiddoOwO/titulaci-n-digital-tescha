<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\PublicContentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DirectorioController extends Controller
{
    public function __construct(private readonly PublicContentService $content) {}

    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');

        return response()->json($this->content->directorio(is_string($search) && trim($search) !== '' ? $search : null));
    }

    public function show(int $id): JsonResponse
    {
        return response()->json($this->content->directorioItem($id) ?? abort(404, 'Contacto no encontrado.'));
    }
}
