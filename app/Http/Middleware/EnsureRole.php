<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Usage: ->middleware('role:estudiante') or ->middleware('role:asesor,administrativo').
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Autenticación requerida.');
        }

        if (! in_array($user->rol, $roles, true)) {
            abort(403, 'No tiene permisos suficientes para acceder a este recurso.');
        }

        return $next($request);
    }
}
