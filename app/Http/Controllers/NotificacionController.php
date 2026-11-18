<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\RespondsInertiaOrJson;
use App\Services\NotificacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Every endpoint is scoped to the authenticated user, whatever the role.
 */
class NotificacionController extends Controller
{
    use RespondsInertiaOrJson;

    public function __construct(private readonly NotificacionService $notificaciones) {}

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        return response()->json([
            'notificaciones' => $this->notificaciones->forUser($userId, $request->query('no_leidas') === 'true'),
            'noLeidas' => $this->notificaciones->unreadCount($userId),
        ]);
    }

    public function markRead(Request $request, int $notificacion): JsonResponse|RedirectResponse
    {
        $this->notificaciones->markRead($notificacion, $request->user()->id);

        return $this->mutated($request, 'Notificación marcada como leída.');
    }

    public function markAllRead(Request $request): JsonResponse|RedirectResponse
    {
        $this->notificaciones->markAllRead($request->user()->id);

        return $this->mutated($request, 'Todas las notificaciones marcadas como leídas.');
    }
}
