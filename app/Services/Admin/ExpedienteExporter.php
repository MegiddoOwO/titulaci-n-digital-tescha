<?php

namespace App\Services\Admin;

use App\Models\Documento;
use App\Support\StoredUploadPath;
use Illuminate\Support\Facades\Storage;
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
                fputcsv($out, [
                    $e['numero_control'],
                    $e['nombre_completo'],
                    $e['opcion_titulacion'],
                    "{$e['porcentaje']}%",
                    $e['estatus'],
                    $e['docs_aprobados'],
                    $e['docs_rechazados'],
                    // toLocaleDateString('es-MX') => d/m/yyyy
                    date('j/n/Y', strtotime((string) $e['fecha_actualizacion'])),
                ]);
            }

            fclose($out);
        }, 'expedientes.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function zip(int $tramiteId): BinaryFileResponse
    {
        $docs = Documento::where('tramite_id', $tramiteId)->whereNotNull('archivo_url')->get(['id', 'archivo_url']);

        abort_if($docs->isEmpty(), 404, 'No hay documentos para descargar.');

        $disk = Storage::disk('local');
        $tmp = tempnam(sys_get_temp_dir(), 'exp');
        $zip = new ZipArchive;
        $zip->open($tmp, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $added = 0;
        $names = [];

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

            $zip->addFile($disk->path($path), $name);
            $added++;
        }

        $zip->close();

        if ($added === 0) {
            // ZipArchive writes nothing for an empty archive; Express answered an empty zip.
            file_put_contents($tmp, "PK\x05\x06".str_repeat("\0", 18));
        }

        return response()->download($tmp, "expediente_{$tramiteId}.zip", ['Content-Type' => 'application/zip'])
            ->deleteFileAfterSend(true);
    }
}
