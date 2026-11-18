<?php

namespace App\Http\Controllers\Asesor;

use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Services\AsesorReadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use RespondsInertiaOrJson;

    public function __invoke(Request $request, AsesorReadService $read): Response|JsonResponse
    {
        $estudiantes = $read->estudiantes($request->user()->id);

        if ($this->wantsPlainJson($request)) {
            return response()->json(['estudiantes' => $estudiantes]);
        }

        return Inertia::render('Asesor/Home', [
            'estudiantes' => $estudiantes,
            'revision' => $read->revision($estudiantes),
            'carga' => $read->carga($request->user()->id, count($estudiantes)),
        ]);
    }
}
