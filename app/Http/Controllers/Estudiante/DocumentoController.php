<?php

namespace App\Http\Controllers\Estudiante;

use App\Actions\Tramites\UploadDocumento;
use App\Http\Controllers\Controller;
use App\Http\Requests\Estudiante\UploadDocumentoRequest;
use App\Models\Documento;
use App\Models\Tramite;
use App\Support\InlineDocumentResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class DocumentoController extends Controller
{
    public function store(UploadDocumentoRequest $request, Tramite $tramite, UploadDocumento $upload): RedirectResponse|Response
    {
        $documento = $upload->execute(
            $tramite,
            $request->user(),
            (int) $request->validated('tipo_documento_id'),
            $request->file('archivo'),
        );

        $message = 'Documento subido correctamente.';

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['message' => $message, 'documento_id' => $documento->id]);
        }

        return back()->with('success', $message);
    }

    public function show(Request $request, Tramite $tramite, Documento $documento): Response
    {
        Gate::authorize('view', $documento);

        return InlineDocumentResponse::for($documento);
    }
}
