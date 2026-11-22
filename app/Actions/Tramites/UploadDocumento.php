<?php

namespace App\Actions\Tramites;

use App\Models\Documento;
use App\Models\HistorialEstado;
use App\Models\TipoDocumento;
use App\Models\Tramite;
use App\Models\Usuario;
use App\Support\Uploads;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Port of server/src/use-cases/tramites/subirDocumento.ts.
 *
 * Storage path mapping: Express stored the bare file name (`<epoch_ms>_<sanitized>`) in
 * `documentos.archivo_url`, relative to `server/uploads/`. Laravel stores
 * `uploads/{tramite_id}/<epoch_ms>_<sanitized>` relative to the `uploads` disk
 * (local storage/app/private or an S3-compatible bucket). Legacy values without a slash are resolved to `uploads/<name>` by
 * DocumentoController, so the cutover only has to copy server/uploads/* into
 * storage/app/private/uploads/.
 */
class UploadDocumento
{
    private const ALLOWED_MIMES = [
        'PDF' => ['application/pdf'],
        'JPEG' => ['image/jpeg'],
        'JPG' => ['image/jpeg'],
        'PNG' => ['image/png'],
    ];

    public function execute(Tramite $tramite, Usuario $user, int $tipoDocumentoId, UploadedFile $file): Documento
    {
        $tipo = TipoDocumento::query()
            ->where('id', $tipoDocumentoId)
            ->where('activo', 1)
            ->where(fn ($q) => $q->whereNull('opcion_titulacion_id')
                ->orWhere('opcion_titulacion_id', $tramite->opcion_titulacion_id))
            ->first();

        if (! $tipo) {
            $this->fail('tipo_documento_id', 'Tipo de documento no válido.');
        }

        $this->assertPrerequisiteApproved($tramite, $tipo);
        $this->assertFileAllowed($tipo, $file);

        $originalName = $file->getClientOriginalName();
        $size = (int) $file->getSize();
        $path = null;

        try {
            return DB::transaction(function () use ($tramite, $user, $tipo, $file, $originalName, $size, &$path) {
                $documento = Documento::where('tramite_id', $tramite->id)
                    ->where('tipo_documento_id', $tipo->id)
                    ->lockForUpdate()
                    ->first();

                // Express lets any state be overwritten; the UI only offers upload for
                // pendiente/rechazado, so approved and under-review documents are blocked here.
                if ($documento && in_array($documento->estatus, ['aprobado', 'en_revision'], true)) {
                    $this->fail('archivo', $documento->estatus === 'aprobado'
                        ? 'El documento ya fue aprobado y no puede reemplazarse.'
                        : 'El documento está en revisión y no puede reemplazarse.');
                }

                $safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
                $filename = (int) (microtime(true) * 1000).'_'.$safeName;
                $path = Uploads::disk()->putFileAs("uploads/{$tramite->id}", $file, $filename);

                if ($path === false) {
                    $this->fail('archivo', 'No se pudo guardar el archivo.');
                }

                $attributes = [
                    'archivo_url' => $path,
                    'archivo_nombre' => $originalName,
                    'archivo_tamaño' => $size,
                    'estatus' => 'cargado',
                    'fecha_subida' => now(),
                    'motivo_rechazo' => null,
                ];

                if ($documento) {
                    $documento->update($attributes);
                } else {
                    $documento = Documento::create($attributes + [
                        'tramite_id' => $tramite->id,
                        'tipo_documento_id' => $tipo->id,
                    ]);
                }

                HistorialEstado::create([
                    'tramite_id' => $tramite->id,
                    'documento_id' => $documento->id,
                    'estado_anterior' => null,
                    'estado_nuevo' => 'cargado',
                    'comentario' => sprintf(
                        'Documento "%s" subido: %s (%s)',
                        $tipo->nombre,
                        $originalName,
                        $size < 1024 ? $size.' B' : round($size / 1024).' KB',
                    ),
                    'usuario_id' => $user->id,
                ]);

                return $documento;
            });
        } catch (Throwable $e) {
            if ($path) {
                Uploads::disk()->delete($path);
            }
            throw $e;
        }
    }

    private function assertPrerequisiteApproved(Tramite $tramite, TipoDocumento $tipo): void
    {
        if (! $tipo->prerrequisito_id) {
            return;
        }

        $approved = Documento::where('tramite_id', $tramite->id)
            ->where('tipo_documento_id', $tipo->prerrequisito_id)
            ->where('estatus', 'aprobado')
            ->exists();

        if (! $approved) {
            $this->fail('archivo', sprintf(
                'El documento "%s" es prerrequisito. Cárguelo y espere su aprobación primero.',
                $tipo->prerrequisito()->value('nombre'),
            ));
        }
    }

    private function assertFileAllowed(TipoDocumento $tipo, UploadedFile $file): void
    {
        $formats = array_map(fn ($f) => strtoupper(trim($f)), explode(',', $tipo->formato_permitido));
        $allowedMimes = [];
        foreach ($formats as $format) {
            $allowedMimes = [...$allowedMimes, ...(self::ALLOWED_MIMES[$format] ?? [])];
        }

        // Fail closed: an unknown catalog format must never turn into "any MIME is fine".
        if ($allowedMimes === []) {
            $this->fail('archivo', 'El tipo de documento no tiene formatos permitidos válidos. Contacte a administración.');
        }

        // Content-sniffed MIME type (stricter than Express, which trusted the client header).
        $mime = $file->getMimeType() ?? $file->getClientMimeType();

        if (! in_array($mime, $allowedMimes, true)) {
            $this->fail('archivo', "Formato no permitido. Solo se aceptan: {$tipo->formato_permitido}.");
        }

        $maxMb = (float) $tipo->getRawOriginal('tamaño_max_mb');
        $size = (int) $file->getSize();

        if ($size > $maxMb * 1024 * 1024) {
            $this->fail('archivo', sprintf(
                'El archivo excede el límite de %s MB. Tamaño actual: %.1f MB.',
                $tipo->getRawOriginal('tamaño_max_mb'),
                $size / 1024 / 1024,
            ));
        }

        if ($mime === 'application/pdf' && ! str_starts_with((string) file_get_contents($file->getRealPath(), false, null, 0, 5), '%PDF')) {
            $this->fail('archivo', 'El archivo parece estar corrupto o no es un PDF válido. Verifique el documento e intente de nuevo.');
        }
    }

    private function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
