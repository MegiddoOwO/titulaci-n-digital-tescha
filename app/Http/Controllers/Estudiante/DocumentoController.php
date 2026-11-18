<?php

namespace App\Http\Controllers\Estudiante;

use App\Actions\Tramites\UploadDocumento;
use App\Http\Controllers\Controller;
use App\Http\Requests\Estudiante\UploadDocumentoRequest;
use App\Models\Documento;
use App\Models\Tramite;
use App\Support\StoredUploadPath;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class DocumentoController extends Controller
{
    private const CONTENT_TYPES = [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
    ];

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

        abort_if(! $documento->archivo_url, 404, 'Documento no encontrado.');

        $path = StoredUploadPath::resolve($documento->archivo_url);
        $disk = Storage::disk(UploadDocumento::DISK);

        abort_unless($path && $disk->exists($path), 404, 'Archivo no encontrado en el servidor.');

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return $disk->response(
            $path,
            $documento->archivo_nombre ?: basename($path),
            ['Content-Type' => self::CONTENT_TYPES[$extension] ?? 'application/octet-stream'],
            'inline',
        );
    }
}
