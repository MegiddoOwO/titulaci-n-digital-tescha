<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\EmitirDictamen;
use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDictamenRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

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
}
