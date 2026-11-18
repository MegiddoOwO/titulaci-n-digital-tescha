<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Services\BitacoraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BitacoraController extends Controller
{
    use RespondsInertiaOrJson;

    public function index(Request $request, BitacoraService $bitacora): JsonResponse|Response
    {
        // Express: parseInt with fallbacks, page >= 1, 1 <= limit <= 50 (default 20).
        $page = max(1, (int) $request->query('page') ?: 1);
        $limit = min(50, max(1, (int) $request->query('limit') ?: 20));
        $result = $bitacora->paginate($page, $limit);

        // Plain JSON clients keep the Express payload; browser visits get the page with the same data.
        return $this->wantsPlainJson($request)
            ? response()->json($result)
            : Inertia::render('Admin/Bitacora', $result);
    }
}
