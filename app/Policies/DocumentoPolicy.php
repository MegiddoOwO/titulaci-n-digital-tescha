<?php

namespace App\Policies;

use App\Models\Asignacion;
use App\Models\Documento;
use App\Models\Usuario;
use Illuminate\Auth\Access\Response;

class DocumentoPolicy
{
    /**
     * Students may only open documents that belong to their own tramite; administrative staff
     * may open any document (Express allowed both roles).
     */
    public function view(Usuario $user, Documento $documento): Response
    {
        if ($user->rol === Usuario::ROL_ADMINISTRATIVO) {
            return Response::allow();
        }

        $owns = $user->rol === Usuario::ROL_ESTUDIANTE
            && $documento->tramite()->value('usuario_id') === $user->id;

        return $owns
            ? Response::allow()
            : Response::deny('No tiene permisos para ver este documento.');
    }

    /**
     * Administrative staff may review any document; an asesor only those of a tramite they are
     * assigned to (any assignment role, like Express).
     */
    public function review(Usuario $user, Documento $documento): Response
    {
        if ($user->rol === Usuario::ROL_ADMINISTRATIVO) {
            return Response::allow();
        }

        $assigned = $user->rol === Usuario::ROL_ASESOR
            && Asignacion::where('tramite_id', $documento->tramite_id)
                ->where('usuario_id', $user->id)
                ->exists();

        return $assigned
            ? Response::allow()
            : Response::deny('No estás asignado a este trámite.');
    }
}
