<?php

namespace App\Actions\Invitaciones;

use App\Mail\InvitacionMail;
use App\Models\Invitacion;
use App\Models\Usuario;
use App\Services\BitacoraService;
use App\Support\MailFailure;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Creates a single-use invitation. The plain token is returned once (as a link) and mailed;
 * only its SHA-256 digest is stored.
 */
class CreateInvitacion
{
    public function __construct(private readonly BitacoraService $bitacora) {}

    /**
     * @param  array<string, mixed>  $data  validated input
     * @return array{invitacion: Invitacion, link: string}
     */
    public function execute(array $data, Usuario $admin): array
    {
        $this->assertAvailable($data['numero_control'], $data['email']);

        ['token' => $token, 'invitacion' => $invitacion] = $this->issue($data, $admin);

        $this->bitacora->log($admin->id, 'invitacion_creada', 'invitacion', $invitacion->id, [
            'numero_control' => $invitacion->numero_control,
            'rol' => $invitacion->rol,
        ]);

        $link = route('invitacion.show', $token);
        self::deliver($invitacion, $link);

        return ['invitacion' => $invitacion, 'link' => $link];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{token: string, invitacion: Invitacion}
     */
    private function issue(array $data, Usuario $admin): array
    {
        $token = bin2hex(random_bytes(32));
        $esAsesor = $data['rol'] === Usuario::ROL_ASESOR;
        $esEstudiante = $data['rol'] === Usuario::ROL_ESTUDIANTE;

        $invitacion = Invitacion::create([
            'token_hash' => Invitacion::hashToken($token),
            'numero_control' => $data['numero_control'],
            'email' => $data['email'],
            'nombre' => $data['nombre'],
            'apellido_paterno' => $data['apellido_paterno'],
            'apellido_materno' => $data['apellido_materno'] ?? null,
            'rol' => $data['rol'],
            'opcion_titulacion_id' => $esEstudiante ? ($data['opcion_titulacion_id'] ?? null) : null,
            'asesor_id' => $esEstudiante ? ($data['asesor_id'] ?? null) : null,
            'grado_academico' => $data['grado_academico'] ?? null,
            'carga_maxima' => $esAsesor ? ($data['carga_maxima'] ?? null) : null,
            'creada_por' => $admin->id,
            'expira_en' => now()->addHours(self::hours()),
        ]);

        return ['token' => $token, 'invitacion' => $invitacion];
    }

    public static function hours(): int
    {
        return max(1, (int) config('auth.invitations.expire_hours', 72));
    }

    /** Used by CreateInvitacion and ResendInvitacion; `$ignoreId` skips the invitation being resent. */
    public static function assertAvailable(string $numeroControl, string $email, ?int $ignoreId = null): void
    {
        $errors = [];

        if (Usuario::where('numero_control', $numeroControl)->exists()) {
            $errors['numero_control'] = 'Ya existe un usuario con ese número de control.';
        }
        if (Usuario::where('email', $email)->exists()) {
            $errors['email'] = 'Ya existe un usuario con ese email.';
        }

        $pending = Invitacion::vigente()
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->where(fn ($q) => $q->where('numero_control', $numeroControl)->orWhere('email', $email))
            ->exists();
        if ($pending) {
            $errors['numero_control'] ??= 'Ya existe una invitación pendiente para ese número de control o email.';
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }

    /** Mail failures never break the request: the admin still holds the link. */
    public static function deliver(Invitacion $invitacion, string $link): void
    {
        try {
            Mail::to($invitacion->email)->send(new InvitacionMail(
                $invitacion->nombre, $invitacion->rol, $invitacion->numero_control, $link, self::hours(),
            ));
        } catch (Throwable $e) {
            MailFailure::log($e, $invitacion->email, 'invitacion');
        }
    }
}
