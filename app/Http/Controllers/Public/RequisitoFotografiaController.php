<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\PublicContentService;
use Illuminate\Http\JsonResponse;

class RequisitoFotografiaController extends Controller
{
    public function __invoke(PublicContentService $content): JsonResponse
    {
        return response()->json($content->requisitosFotografia());
    }
}
