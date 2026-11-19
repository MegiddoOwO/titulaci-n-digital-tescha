<?php

namespace App\Http\Controllers\Asesor;

use App\Http\Controllers\Controller;
use App\Models\Documento;
use App\Models\Tramite;
use App\Support\InlineDocumentResponse;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets an asesor open the file of a document they review, limited to their assigned tramites.
 */
class DocumentoController extends Controller
{
    public function show(Tramite $tramite, Documento $documento): Response
    {
        Gate::authorize('viewAsAsesor', $documento);

        return InlineDocumentResponse::for($documento);
    }
}
