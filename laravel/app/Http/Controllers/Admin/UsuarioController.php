<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\CreateUsuario;
use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUsuarioRequest;
use App\Http\Requests\Admin\UpdateUsuarioRequest;
use App\Models\Usuario;
use App\Services\Admin\UsuarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UsuarioController extends Controller
{
    use RespondsInertiaOrJson;

    public function __construct(private readonly UsuarioService $usuarios) {}

    public function index(Request $request): JsonResponse|Response
    {
        // Browser visits get the (placeholder) page; plain JSON clients keep the Express payload.
        if (! $this->wantsPlainJson($request)) {
            return Inertia::render('Admin/Usuarios');
        }

        return response()->json($this->usuarios->list(
            $request->query('search') ?: null,
            $request->query('rol') ?: null,
            max(1, (int) $request->query('page') ?: 1),
        ));
    }

    public function show(int $usuario): JsonResponse
    {
        return response()->json($this->usuarios->detail($this->findOrFail($usuario)));
    }

    public function store(StoreUsuarioRequest $request, CreateUsuario $create): JsonResponse|RedirectResponse
    {
        $usuario = $create->execute($request->validated());

        return $this->mutated($request, 'Usuario creado correctamente.', ['id' => $usuario->id]);
    }

    public function update(UpdateUsuarioRequest $request, int $usuario): JsonResponse|RedirectResponse
    {
        $this->usuarios->update($this->findOrFail($usuario), $request->validated());

        return $this->mutated($request, 'Usuario actualizado correctamente.');
    }

    public function toggle(Request $request, int $usuario): JsonResponse|RedirectResponse
    {
        $activo = $this->usuarios->toggle($this->findOrFail($usuario));

        return $this->mutated($request, $activo ? 'Usuario activado.' : 'Usuario desactivado.', ['activo' => $activo]);
    }

    public function destroy(Request $request, int $usuario): JsonResponse|RedirectResponse
    {
        $this->usuarios->delete($this->findOrFail($usuario), $request->user());

        return $this->mutated($request, 'Usuario eliminado correctamente.');
    }

    public function docentes(): JsonResponse
    {
        return response()->json($this->usuarios->docentes());
    }

    public function opcionesTitulacion(): JsonResponse
    {
        return response()->json($this->usuarios->opcionesTitulacion());
    }

    private function findOrFail(int $id): Usuario
    {
        return Usuario::find($id) ?? abort(404, 'Usuario no encontrado.');
    }
}
