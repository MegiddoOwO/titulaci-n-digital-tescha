<?php

namespace App\Services\Admin;

use App\Models\Documento;
use App\Support\StoredUploadPath;
use App\Support\Uploads;
use ZipArchive;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Port of the Express expedientes export (xlsx there, CSV here) and ZIP download (adm-zip).
 */
class ExpedienteExporter
{
    private const HEADERS = [
        'Matrícula', 'Estudiante', 'Opción Titulación', 'Avance', 'Estado',
        'Docs Aprobados', 'Docs Rechazados', 'Última Actualización',
    ];

    public function __construct(private readonly ExpedienteService $expedientes) {}

    public function csv(?string $search, ?string $estatus): StreamedResponse
    {
        $rows = $this->expedientes->list($search, $estatus, 1, 10000)['expedientes'];

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, self::HEADERS);

            foreach ($rows as $e) {
                fputcsv($out, array_map(self::neutralize(...), [
                    $e['numero_control'],
                    $e['nombre_completo'],
                    $e['opcion_titulacion'],
                    "{$e['porcentaje']}%",
                    $e['estatus'],
                    $e['docs_aprobados'],
                    $e['docs_rechazados'],
                    // toLocaleDateString('es-MX') => d/m/yyyy
                    date('j/n/Y', strtotime((string) $e['fecha_actualizacion'])),
                ]));
            }

            fclose($out);
        }, 'expedientes.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Prevent spreadsheet formula injection: prefix risky leading characters with a single quote.
     */
    private static function neutralize(mixed $value): mixed
    {
        if (is_string($value) && $value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }

    public function zip(int $tramiteId): BinaryFileResponse
    {
        $docs = Documento::where('tramite_id', $tramiteId)->whereNotNull('archivo_url')->get(['id', 'archivo_url']);

        abort_if($docs->isEmpty(), 404, 'No hay documentos para descargar.');

        $disk = Uploads::disk();
        $tmp = tempnam(sys_get_temp_dir(), 'exp');
        $zip = new ZipArchive;
        $zip->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $added = 0;
        $names = [];
        $temps = [];

        foreach ($docs as $doc) {
            $path = StoredUploadPath::resolve($doc->archivo_url);

            if (! $path || ! $disk->exists($path)) {
                continue; // Express silently skips missing files
            }

            $name = basename($path);
            if (isset($names[$name])) {
                $name = "{$doc->id}_{$name}";
            }
            $names[$name] = true;

            // Copy the object to a temp file by stream (works for local and S3, no whole-file reads).
            $stream = $disk->readStream($path);
            if (! is_resource($stream)) {
                continue;
            }
            $copy = tempnam(sys_get_temp_dir(), 'expf');
            $out = fopen($copy, 'wb');
            stream_copy_to_stream($stream, $out);
            fclose($out);
            fclose($stream);

            $temps[] = $copy;
            $zip->addFile($copy, $name);
            $added++;
        }

        $zip->close();
        foreach ($temps as $copy) {
            @unlink($copy);
        }

        if ($added === 0) {
            // ZipArchive writes nothing for an empty archive; Express answered an empty zip.
            file_put_contents($tmp, "PK\x05\x06".str_repeat("\0", 18));
        }

        return response()->download($tmp, "expediente_{$tramiteId}.zip", ['Content-Type' => 'application/zip'])
            ->deleteFileAfterSend(true);
    }
}
