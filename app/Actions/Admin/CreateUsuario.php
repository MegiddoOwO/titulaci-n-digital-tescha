<?php

namespace App\Actions\Admin;

use App\Models\Asignacion;
use App\Models\Documento;
use App\Models\TipoDocumento;
use App\Models\Tramite;
use App\Models\Usuario;
use App\Models\VwCargaDocente;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Port of AdminRepository.crearUsuario. The admin supplies the password (Express neither
 * generates one nor e-mails the new user). A student also gets a tramite, one pending document
 * per applicable document type and, when the asesor has room, an `asesor` assignment.
 */
class CreateUsuario
{
    public const DEFAULT_OPCION_ID = 1;

    /**
     * @param  array<string, mixed>  $data  validated input
     */
    public function execute(array $data): Usuario
    {
        return DB::transaction(function () use ($data) {
            $usuario = Usuario::create([
                'numero_control' => $data['numero_control'],
                'email' => $data['email'],
                'password_hash' => Hash::make($data['password']),
                'nombre' => $data['nombre'],
                'apellido_paterno' => $data['apellido_paterno'],
                'apellido_materno' => $data['apellido_materno'] ?? null,
                'rol' => $data['rol'],
                'grado_academico' => $data['grado_academico'] ?? null,
                'carga_maxima' => $data['rol'] === Usuario::ROL_ASESOR
                    ? ($data['carga_maxima'] ?? null) ?: CreateAsignacion::DEFAULT_MAX_LOAD
                    : null,
            ]);

            if ($data['rol'] === Usuario::ROL_ESTUDIANTE) {
                $this->openTramite($usuario, $data);
            }

            return $usuario;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function openTramite(Usuario $usuario, array $data): void
    {
        $opcionId = ($data['opcion_titulacion_id'] ?? null) ?: self::DEFAULT_OPCION_ID;

        $tramite = Tramite::create([
            'usuario_id' => $usuario->id,
            'opcion_titulacion_id' => $opcionId,
            'estatus' => 'en_proceso',
        ]);

        TipoDocumento::where('activo', 1)
            ->where(fn ($q) => $q->whereNull('opcion_titulacion_id')->orWhere('opcion_titulacion_id', $opcionId))
            ->get()
            ->each(fn (TipoDocumento $tipo) => Documento::create([
                'tramite_id' => $tramite->id,
                'tipo_documento_id' => $tipo->id,
                'estatus' => 'pendiente',
            ]));

        $asesorId = $data['asesor_id'] ?? null;
        $carga = $asesorId ? VwCargaDocente::find($asesorId) : null;

        // Silently skipped when the advisor is unknown or full, like Express.
        if ($carga && $carga->carga_actual < ($carga->carga_maxima ?: CreateAsignacion::DEFAULT_MAX_LOAD)) {
            Asignacion::create([
                'tramite_id' => $tramite->id,
                'usuario_id' => $carga->docente_id,
                'rol_asignacion' => 'asesor',
            ]);
        }
    }
}
