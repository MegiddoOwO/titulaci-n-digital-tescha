<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/ResetPassword', ['token' => $request->route('token')]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'token.required' => 'Token y nueva contraseña son requeridos.',
            'password.required' => 'Token y nueva contraseña son requeridos.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'La confirmación de contraseña no coincide.',
        ]);

        $usuario = Usuario::where('reset_token', hash('sha256', $request->string('token')->toString()))
            ->where('reset_expira', '>', DB::raw('NOW()'))
            ->where('activo', 1)
            ->first();

        if (! $usuario) {
            return back()->withErrors(['token' => 'Token inválido o expirado.']);
        }

        Usuario::whereKey($usuario->id)->update([
            'password_hash' => Hash::make($request->string('password')->toString()),
            'reset_token' => null,
            'reset_expira' => null,
            'intentos_fallidos' => 0,
            'bloqueado_hasta' => null,
        ]);

        return redirect()->route('login')->with('status', 'Contraseña restablecida correctamente.');
    }
}
