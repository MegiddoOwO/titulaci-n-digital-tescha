<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\EmitirDictamen;
use App\Contracts\DictamenPdfRenderer;
use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDictamenRequest;
use App\Models\Dictamen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

class DictamenController extends Controller
{
    use RespondsInertiaOrJson;

    public function store(StoreDictamenRequest $request, EmitirDictamen $emitir): JsonResponse|RedirectResponse
    {
        $emitir->execute(
            (int) $request->validated('tramite_id'),
            $request->validated('resultado'),
            (string) ($request->validated('observaciones') ?? ''),
            $request->user(),
        );

        return $this->mutated($request, 'Dictamen emitido correctamente.');
    }

    public function pdf(int $tramite, DictamenPdfRenderer $renderer): Response
    {
        $dictamen = Dictamen::where('tramite_id', $tramite)->first() ?? abort(404, 'Dictamen no encontrado.');

        return $renderer->render($dictamen);
    }
}
