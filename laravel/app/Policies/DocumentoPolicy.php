<?php

namespace App\Policies;

use App\Models\Documento;
use App\Models\Usuario;
use Illuminate\Auth\Access\Response;

class DocumentoPolicy
{
    /**
     * Students may only open documents that belong to their own tramite.
     */
    public function view(Usuario $user, Documento $documento): Response
    {
        $owns = $user->rol === Usuario::ROL_ESTUDIANTE
            && $documento->tramite()->value('usuario_id') === $user->id;

        return $owns
            ? Response::allow()
            : Response::deny('No tiene permisos para ver este documento.');
    }
}
