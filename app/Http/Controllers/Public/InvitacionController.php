<?php

namespace App\Http\Controllers\Public;

use App\Actions\Invitaciones\AcceptInvitacion;
use App\Http\Controllers\Controller;
use App\Http\Requests\AceptarInvitacionRequest;
use App\Models\Invitacion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
                'nombre_completo' => trim(implode(' ', array_filter([$invitacion->nombre, $invitacion->apellido_paterno, $invitacion->apellido_materno]))),
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

        // The new account belongs to someone else: do not leave a different identity signed in
        // in this browser (for example an administrator testing the link).
        if (Auth::check()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect()->route('login')->with('status', 'Cuenta creada. Inicia sesión con tu número de control.');
    }
}
