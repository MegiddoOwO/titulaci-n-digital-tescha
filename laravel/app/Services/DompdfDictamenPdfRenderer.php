<?php

namespace App\Services;

use App\Contracts\DictamenPdfRenderer;
use App\Models\Dictamen;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\Response;

/**
 * Port of Express generarDictamenPDF (pdfkit): same layout, fields and filename, drawn with
 * Dompdf from resources/views/pdf/dictamen.blade.php (letter size, absolutely positioned).
 */
class DompdfDictamenPdfRenderer implements DictamenPdfRenderer
{
    public function render(Dictamen $dictamen): Response
    {
        $dictamen->loadMissing('tramite.usuario', 'tramite.opcionTitulacion');
        $student = $dictamen->tramite->usuario;

        $emitted = $dictamen->fecha_emision->copy()->locale('es');

        $campos = [
            ['label' => 'Alumno:', 'value' => trim("{$student->nombre} {$student->apellido_paterno} {$student->apellido_materno}")],
            ['label' => 'Número de Control:', 'value' => $student->numero_control],
            ['label' => 'Opción de Titulación:', 'value' => $dictamen->tramite->opcionTitulacion->nombre],
            ['label' => 'Fecha de Emisión:', 'value' => $emitted->translatedFormat('j \d\e F \d\e Y')],
        ];

        return Pdf::loadView('pdf.dictamen', [
            'campos' => $campos,
            'aprobado' => $dictamen->resultado === 'aprobado',
            'observaciones' => $dictamen->observaciones,
        ])->setPaper('letter')->stream("dictamen_{$student->numero_control}.pdf");
    }
}
