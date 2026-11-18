<?php

namespace App\Http\Controllers\Estudiante;

use App\Contracts\DictamenPdfRenderer;
use App\Http\Controllers\Controller;
use App\Models\Dictamen;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DictamenController extends Controller
{
    public function pdf(Request $request, DictamenPdfRenderer $renderer): Response
    {
        $dictamen = Dictamen::whereHas('tramite', fn ($q) => $q->where('usuario_id', $request->user()->id))
            ->orderByDesc('fecha_emision')->orderByDesc('id')
            ->first() ?? abort(404, 'No tienes un dictamen emitido aún.');

        return $renderer->render($dictamen);
    }
}
