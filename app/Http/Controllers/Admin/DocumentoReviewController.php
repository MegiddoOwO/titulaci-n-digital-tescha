<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Documentos\ReviewDocumento;
use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Review\RejectDocumentoRequest;
use App\Models\Documento;
use App\Services\Admin\ExpedienteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DocumentoReviewController extends Controller
{
    use RespondsInertiaOrJson;

    /**
     * Review queue page. Like the legacy page it lists the first 20 expedientes (optionally
     * filtered by search); the documents of the selected one load on demand from the detail endpoint.
     */
    public function index(Request $request, ExpedienteService $expedientes): Response
    {
        $search = $request->query('search');
        $search = is_string($search) && $search !== '' ? $search : null;

        return Inertia::render('Admin/Documentos', [
            'expedientes' => $expedientes->list($search, null, 1, 20)['expedientes'],
            'filters' => ['search' => $search ?? ''],
        ]);
    }

    public function approve(Request $request, int $documento, ReviewDocumento $review): JsonResponse|RedirectResponse
    {
        $doc = $this->resolve($documento);
        Gate::authorize('review', $doc);

        $review->approve($doc, $request->user());

        return $this->mutated($request, 'Documento aprobado correctamente.', ['tramite_id' => $doc->tramite_id]);
    }

    public function reject(RejectDocumentoRequest $request, int $documento, ReviewDocumento $review): JsonResponse|RedirectResponse
    {
        $doc = $this->resolve($documento);
        Gate::authorize('review', $doc);

        $review->reject($doc, $request->user(), trim($request->validated('motivo')));

        return $this->mutated($request, 'Documento rechazado correctamente.', ['tramite_id' => $doc->tramite_id]);
    }

    private function resolve(int $id): Documento
    {
        return Documento::find($id) ?? abort(404, 'Documento no encontrado.');
    }
}
