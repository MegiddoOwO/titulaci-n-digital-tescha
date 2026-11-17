<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\BitacoraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BitacoraController extends Controller
{
    public function index(Request $request, BitacoraService $bitacora): JsonResponse
    {
        // Express: parseInt with fallbacks, page >= 1, 1 <= limit <= 50 (default 20).
        $page = max(1, (int) $request->query('page') ?: 1);
        $limit = min(50, max(1, (int) $request->query('limit') ?: 20));

        return response()->json($bitacora->paginate($page, $limit));
    }
}
