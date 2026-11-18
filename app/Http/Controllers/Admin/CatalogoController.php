<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CatalogoRequest;
use App\Services\Admin\CatalogoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * One controller for every admin catalog; the route constrains {catalogo} to the registry keys.
 */
class CatalogoController extends Controller
{
    use RespondsInertiaOrJson;

    public function __construct(private readonly CatalogoService $catalogos) {}

    /**
     * The catalogs page: the active tab lives in the query string and only that catalog is loaded.
     */
    public function page(Request $request): Response
    {
        $tab = $request->query('tab');
        $tab = is_string($tab) && array_key_exists($tab, CatalogoService::CATALOGS) ? $tab : 'opciones';

        return Inertia::render('Admin/Catalogos', [
            'tab' => $tab,
            'items' => $this->catalogos->list($tab),
        ]);
    }

    public function index(string $catalogo): JsonResponse
    {
        return response()->json($this->catalogos->list($catalogo));
    }

    public function store(CatalogoRequest $request, string $catalogo): JsonResponse|RedirectResponse
    {
        $item = $this->catalogos->create($catalogo, $request->validated());

        return $this->mutated($request, 'Creado correctamente.', ['id' => $item->id]);
    }

    public function update(CatalogoRequest $request, string $catalogo, int $id): JsonResponse|RedirectResponse
    {
        $this->catalogos->update($catalogo, $this->catalogos->find($catalogo, $id), $request->validated());

        return $this->mutated($request, 'Actualizado correctamente.');
    }

    public function toggle(Request $request, string $catalogo, int $id): JsonResponse|RedirectResponse
    {
        $this->catalogos->toggle($this->catalogos->find($catalogo, $id));

        return $this->mutated($request, 'Estado actualizado.');
    }
}
