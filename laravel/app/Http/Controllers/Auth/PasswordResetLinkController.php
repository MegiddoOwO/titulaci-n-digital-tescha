<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\Usuario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class PasswordResetLinkController extends Controller
{
    public const MESSAGE = 'Si el número de control existe, recibirás un correo con instrucciones.';

    /**
     * Password recovery lives in a modal on the login page (as in the legacy UI).
     */
    public function create(): RedirectResponse
    {
        return redirect()->route('login');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(
            ['numero_control' => ['required', 'string']],
            ['numero_control.required' => 'Número de control requerido.'],
        );

        $usuario = Usuario::where('numero_control', $request->string('numero_control')->toString())
            ->where('activo', 1)
            ->first();

        if ($usuario) {
            $token = bin2hex(random_bytes(32));

            // Only the SHA-256 digest is stored; the plain token travels by e-mail only.
            Usuario::whereKey($usuario->id)->update([
                'reset_token' => hash('sha256', $token),
                'reset_expira' => DB::raw('DATE_ADD(NOW(), INTERVAL 1 HOUR)'),
            ]);

            Mail::to($usuario->email)->send(
                new ResetPasswordMail($usuario->nombre, route('password.reset', ['token' => $token]))
            );
        }

        // Same answer whether or not the account exists.
        return back()->with('status', self::MESSAGE);
    }
}
