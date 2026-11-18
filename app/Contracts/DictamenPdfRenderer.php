<?php

namespace App\Contracts;

use App\Models\Dictamen;
use Symfony\Component\HttpFoundation\Response;

/**
 * Renders the dictamen PDF (Express generarDictamenPDF); bound to the Dompdf implementation.
 */
interface DictamenPdfRenderer
{
    public function render(Dictamen $dictamen): Response;
}
