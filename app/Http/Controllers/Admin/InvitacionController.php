<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Invitaciones\CreateInvitacion;
use App\Actions\Invitaciones\ResendInvitacion;
use App\Actions\Invitaciones\RevokeInvitacion;
use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreInvitacionRequest;
use App\Models\Invitacion;
use App\Services\Admin\InvitacionService;
use App\Services\Admin\UsuarioService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvitacionController extends Controller
{
    use RespondsInertiaOrJson;

    public function __construct(
        private readonly InvitacionService $invitaciones,
        private readonly UsuarioService $usuarios,
    ) {}

    public function index(Request $request): JsonResponse|Response
    {
        $search = $request->string('search')->toString() ?: null;
        $estado = $request->string('estado')->toString() ?: null;
        $result = $this->invitaciones->list($search, $estado, max(1, (int) $request->query('page') ?: 1));

        $props = $result + [
            'filters' => ['search' => $search ?? '', 'estado' => $estado ?? ''],
            'opciones' => $this->usuarios->opcionesTitulacion(),
            'asesores' => $this->usuarios->docentes(),
            'expire_hours' => max(1, (int) config('auth.invitations.expire_hours', 72)),
            'max_rows' => \App\Services\Admin\InvitacionMasivaService::maxRows(),
        ];

        return $this->wantsPlainJson($request) ? response()->json($props) : Inertia::render('Admin/Invitaciones', $props);
    }

    public function store(StoreInvitacionRequest $request, CreateInvitacion $create): JsonResponse|RedirectResponse
    {
        ['invitacion' => $invitacion, 'link' => $link, 'correo' => $correo] = $create->execute($request->validated(), $request->user());

        return $this->withLink($request, 'Invitación creada correctamente.', $link, $correo, $invitacion->id, 201);
    }

    public function resend(Request $request, int $invitacion, ResendInvitacion $resend): JsonResponse|RedirectResponse
    {
        $model = Invitacion::find($invitacion) ?? abort(404, 'Invitación no encontrada.');
        ['link' => $link, 'correo' => $correo] = $resend->execute($model, $request->user());

        return $this->withLink($request, 'Invitación reenviada correctamente.', $link, $correo, $model->id);
    }

    public function destroy(Request $request, int $invitacion, RevokeInvitacion $revoke): JsonResponse|RedirectResponse
    {
        $revoke->execute(Invitacion::find($invitacion) ?? abort(404, 'Invitación no encontrada.'), $request->user());

        return $this->mutated($request, 'Invitación revocada correctamente.');
    }

    /** The plain link travels only in this response (JSON key or one-time flash). */
    private function withLink(Request $request, string $message, string $link, string $correo, int $id, int $status = 200): JsonResponse|RedirectResponse
    {
        if ($this->wantsPlainJson($request)) {
            return response()->json(['message' => $message, 'id' => $id, 'link' => $link, 'correo' => $correo], $status);
        }

        return back()->with('success', $message)->with('invitacion_link', $link)->with('invitacion_correo', $correo);
    }
}
