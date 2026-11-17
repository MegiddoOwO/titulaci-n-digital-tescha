<?php

namespace App\Services;

use App\Contracts\DictamenPdfRenderer;
use App\Models\Dictamen;
use Symfony\Component\HttpFoundation\Response;

class NotImplementedDictamenPdfRenderer implements DictamenPdfRenderer
{
    public function render(Dictamen $dictamen): Response
    {
        abort(501, 'La generación del PDF de dictamen aún no está disponible.');
    }
}
