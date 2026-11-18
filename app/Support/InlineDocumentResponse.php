<?php

namespace App\Support;

use App\Actions\Tramites\UploadDocumento;
use App\Models\Documento;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

/**
 * Streams a stored document inline (same headers for every role that may open it).
 * Callers authorize first; this only resolves the file or aborts with 404.
 */
final class InlineDocumentResponse
{
    private const CONTENT_TYPES = [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
    ];

    public static function for(Documento $documento): Response
    {
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
