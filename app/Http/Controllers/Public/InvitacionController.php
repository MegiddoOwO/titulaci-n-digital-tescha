<?php

namespace App\Http\Controllers\Public;

use App\Actions\Invitaciones\AcceptInvitacion;
use App\Http\Controllers\Controller;
use App\Http\Requests\AceptarInvitacionRequest;
use App\Models\Invitacion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InvitacionController extends Controller
{
    public const INVALID = 'Enlace inválido o expirado.';

    public function show(string $token): Response
    {
        $invitacion = Invitacion::vigente()->where('token_hash', Invitacion::hashToken($token))->first();

        if (! $invitacion) {
            return Inertia::render('Invitacion/Aceptar', ['valida' => false]);
        }

        return Inertia::render('Invitacion/Aceptar', [
            'valida' => true,
            'invitacion' => [
                'nombre' => $invitacion->nombre,
                'rol' => $invitacion->rol,
                'numero_control' => $invitacion->numero_control,
                'expira_en' => $invitacion->expira_en->toIso8601String(),
            ],
        ]);
    }

    public function store(AceptarInvitacionRequest $request, string $token, AcceptInvitacion $accept): RedirectResponse
    {
        $usuario = $accept->execute($token, $request->string('password')->toString());

        if (! $usuario) {
            throw ValidationException::withMessages(['token' => self::INVALID]);
        }

        return redirect()->route('login')->with('status', 'Cuenta creada. Inicia sesión con tu número de control.');
    }
}
