<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Services\Admin\AdminStatsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use RespondsInertiaOrJson;

    public function __construct(private readonly AdminStatsService $stats) {}

    public function show(Request $request): Response|JsonResponse
    {
        if ($this->wantsPlainJson($request)) {
            return response()->json($this->stats->stats());
        }

        return Inertia::render('Admin/Home', ['stats' => $this->stats->stats()]);
    }

    /** Express GET /api/admin/stats: always the raw stats payload. */
    public function stats(): JsonResponse
    {
        return response()->json($this->stats->stats());
    }
}
