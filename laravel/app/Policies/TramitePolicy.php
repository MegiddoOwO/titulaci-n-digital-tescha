<?php

namespace App\Policies;

use App\Models\Tramite;
use App\Models\Usuario;
use Illuminate\Auth\Access\Response;

class TramitePolicy
{
    public function view(Usuario $user, Tramite $tramite): Response
    {
        return $this->owns($user, $tramite)
            ? Response::allow()
            : Response::deny('Trámite no encontrado o no pertenece a este usuario.');
    }

    public function uploadDocument(Usuario $user, Tramite $tramite): Response
    {
        return $this->owns($user, $tramite)
            ? Response::allow()
            : Response::deny('No tiene permiso para subir documentos a este trámite.');
    }

    /**
     * An asesor may read a tramite only while assigned to it (any assignment role, as the
     * asesor dashboard lists them).
     */
    public function viewAsAsesor(Usuario $user, Tramite $tramite): Response
    {
        $assigned = $user->rol === Usuario::ROL_ASESOR
            && $tramite->asignaciones()->where('usuario_id', $user->id)->exists();

        return $assigned
            ? Response::allow()
            : Response::deny('No tiene permiso para ver este trámite.');
    }

    private function owns(Usuario $user, Tramite $tramite): bool
    {
        return $user->rol === Usuario::ROL_ESTUDIANTE && $tramite->usuario_id === $user->id;
    }
}
