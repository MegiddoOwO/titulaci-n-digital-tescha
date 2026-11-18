<?php

namespace App\Http\Controllers\Asesor;

use App\Actions\Documentos\ReviewDocumento;
use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Review\RejectDocumentoRequest;
use App\Models\Documento;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DocumentoReviewController extends Controller
{
    use RespondsInertiaOrJson;

    public function approve(Request $request, int $documento, ReviewDocumento $review): JsonResponse|RedirectResponse
    {
        $doc = $this->resolve($documento);
        Gate::authorize('review', $doc);

        $review->approve($doc, $request->user());

        return $this->mutated($request, 'Documento aprobado.');
    }

    public function reject(RejectDocumentoRequest $request, int $documento, ReviewDocumento $review): JsonResponse|RedirectResponse
    {
        $doc = $this->resolve($documento);
        Gate::authorize('review', $doc);

        $review->reject($doc, $request->user(), trim($request->validated('motivo')));

        return $this->mutated($request, 'Documento rechazado.');
    }

    private function resolve(int $id): Documento
    {
        return Documento::find($id) ?? abort(404, 'Documento no encontrado.');
    }
}
