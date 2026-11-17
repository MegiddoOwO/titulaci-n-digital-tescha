<?php

namespace App\Services;

use App\Mail\NotificacionMail;
use App\Models\Notificacion;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Port of NotificacionService.create (server/src/infrastructure/services/NotificacionService.ts).
 *
 * Stores the in-app row and, for `tipo` email|ambos, also e-mails the user. A mail failure is
 * reported but never fails the caller (Express logs and swallows it).
 */
class NotificacionService
{
    public function create(int $usuarioId, string $titulo, string $mensaje, string $tipo = 'in_app', ?int $tramiteId = null): Notificacion
    {
        $notificacion = Notificacion::create([
            'usuario_id' => $usuarioId,
            'tipo' => $tipo,
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'tramite_id' => $tramiteId,
        ]);

        if (in_array($tipo, ['email', 'ambos'], true)) {
            $this->sendEmail($usuarioId, $titulo, $mensaje);
        }

        return $notificacion;
    }

    private function sendEmail(int $usuarioId, string $titulo, string $mensaje): void
    {
        try {
            $usuario = Usuario::find($usuarioId);

            if (! $usuario) {
                return;
            }

            Mail::to($usuario->email)->send(new NotificacionMail($usuario->nombre, $titulo, $mensaje));
        } catch (Throwable $e) {
            report($e);
        }
    }

    /**
     * Latest 50 of one user, newest first (Express getByUsuario).
     *
     * @return array<int, array<string, mixed>>
     */
    public function forUser(int $usuarioId, bool $onlyUnread = false): array
    {
        return DB::table('notificaciones')
            ->where('usuario_id', $usuarioId)
            ->when($onlyUnread, fn ($q) => $q->where('leida', 0))
            ->orderByDesc('created_at')->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn ($r) => (array) $r)
            ->all();
    }

    public function unreadCount(int $usuarioId): int
    {
        return Notificacion::where('usuario_id', $usuarioId)->where('leida', 0)->count();
    }

    /**
     * Scoped to the owner; another user's id is a silent no-op, like Express.
     */
    public function markRead(int $notificacionId, int $usuarioId): void
    {
        Notificacion::where('id', $notificacionId)->where('usuario_id', $usuarioId)
            ->update(['leida' => 1, 'fecha_lectura' => now()]);
    }

    public function markAllRead(int $usuarioId): void
    {
        Notificacion::where('usuario_id', $usuarioId)->where('leida', 0)
            ->update(['leida' => 1, 'fecha_lectura' => now()]);
    }
}
