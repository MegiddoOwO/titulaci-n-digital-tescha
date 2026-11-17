<?php

namespace App\Contracts;

use App\Models\Dictamen;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hook for the dictamen PDF (Express generarDictamenPDF). Implemented in T6;
 * until then the container binds a renderer that answers 501.
 */
interface DictamenPdfRenderer
{
    public function render(Dictamen $dictamen): Response;
}
