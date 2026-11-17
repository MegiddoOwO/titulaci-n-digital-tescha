<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Services\TramiteReadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TramiteController extends Controller
{
    public function __construct(private readonly TramiteReadService $tramites) {}

    public function show(Request $request): Response|\Illuminate\Http\JsonResponse
    {
        $tramite = $this->tramites->activeTramiteFor($request->user()->id);

        if (! $tramite) {
            // Express answers 404 JSON; the Inertia page renders an error state instead.
            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return response()->json(['message' => TramiteReadService::NOT_FOUND], 404);
            }

            return Inertia::render('Dashboard', [
                'tramite' => null,
                'error' => TramiteReadService::NOT_FOUND,
                'historial' => [],
            ]);
        }

        Gate::authorize('view', $tramite);

        return Inertia::render('Dashboard', [
            'tramite' => $this->tramites->detail($tramite),
            'error' => null,
            // Loaded right after first paint; heavy and not needed to render the page shell.
            'historial' => Inertia::defer(fn () => $this->tramites->historial($tramite)),
        ]);
    }
}
