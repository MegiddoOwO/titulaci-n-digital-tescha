<?php

namespace App\Services\Admin;

use App\Models\Usuario;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Port of AdminRepository user methods (listarUsuarios, getUsuario, toggleActivo,
 * actualizarUsuario, eliminarUsuario) and the docentes / opciones lookups.
 */
class UsuarioService
{
    public const PAGE_SIZE = 20;

    /**
     * @return array{usuarios: array<int, array<string, mixed>>, total: int, page: int, totalPages: int}
     */
    public function list(?string $search, ?string $rol, int $page): array
    {
        $query = DB::table('usuarios as u');

        if ($search) {
            $like = "%{$search}%";
            $query->where(fn ($q) => $q->where('u.numero_control', 'like', $like)
                ->orWhereRaw("CONCAT(u.nombre, ' ', u.apellido_paterno) LIKE ?", [$like])
                ->orWhere('u.email', 'like', $like));
        }

        if ($rol) {
            $query->where('u.rol', $rol);
        }

        $total = (clone $query)->count();

        $rows = $query
            ->orderBy('u.rol')->orderBy('u.nombre')->orderBy('u.id')
            ->offset(($page - 1) * self::PAGE_SIZE)
            ->limit(self::PAGE_SIZE)
            ->get(['u.id', 'u.numero_control', 'u.email', 'u.nombre', 'u.apellido_paterno',
                'u.apellido_materno', 'u.rol', 'u.activo', 'u.grado_academico', 'u.carga_maxima',
                'u.intentos_fallidos', 'u.created_at'])
            ->map(fn ($r) => (array) $r)
            ->all();

        return [
            'usuarios' => $rows,
            'total' => $total,
            'page' => $page,
            'totalPages' => (int) ceil($total / self::PAGE_SIZE),
        ];
    }

    /**
     * Express answered `SELECT *` (password hash included); the hash and reset token stay hidden here.
     *
     * @return array<string, mixed>
     */
    public function detail(Usuario $usuario): array
    {
        return ['activo' => (int) $usuario->activo] + $usuario->toArray();
    }

    /**
     * Activate / deactivate. Also clears the lockout counters, like Express.
     */
    public function toggle(Usuario $usuario, ?Usuario $actor = null): int
    {
        if ($actor !== null && $usuario->is($actor) && $usuario->activo) {
            throw ValidationException::withMessages(['usuario' => 'No puede desactivarse a sí mismo.']);
        }

        $nuevo = $usuario->activo ? 0 : 1;
        $usuario->forceFill(['activo' => $nuevo, 'intentos_fallidos' => 0, 'bloqueado_hasta' => null])->save();

        return $nuevo;
    }

    /**
     * Express quirk kept: numero_control, email, nombre, apellido_paterno, rol and password only
     * change when truthy; apellido_materno, grado_academico and carga_maxima change when present.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Usuario $usuario, array $data): void
    {
        $fields = [];

        foreach (['numero_control', 'email', 'nombre', 'apellido_paterno', 'rol'] as $key) {
            if (! empty($data[$key])) {
                $fields[$key] = $data[$key];
            }
        }

        foreach (['apellido_materno', 'grado_academico', 'carga_maxima'] as $key) {
            if (array_key_exists($key, $data)) {
                $fields[$key] = $data[$key];
            }
        }

        if (! empty($data['password'])) {
            $fields['password_hash'] = Hash::make($data['password']);
        }

        if ($fields === []) {
            throw ValidationException::withMessages(['usuario' => 'No hay campos para actualizar.']);
        }

        $usuario->update($fields);
    }

    /**
     * Express quirks kept: the guard counts active administrators whatever the target's own state;
     * related rows disappear through the schema's ON DELETE CASCADE (uploaded files stay on disk).
     */
    public function delete(Usuario $usuario, Usuario $actor): void
    {
        if ($usuario->is($actor)) {
            throw ValidationException::withMessages(['usuario' => 'No puede eliminarse a sí mismo.']);
        }

        if ($usuario->rol === Usuario::ROL_ADMINISTRATIVO) {
            $activeAdmins = Usuario::where('rol', Usuario::ROL_ADMINISTRATIVO)->where('activo', 1)->count();

            if ($activeAdmins <= 1) {
                throw ValidationException::withMessages([
                    'usuario' => 'No se puede eliminar el último administrador activo.',
                ]);
            }
        }

        try {
            $usuario->delete();
        } catch (QueryException $e) {
            // e.g. dictamenes.emitido_por has no cascade; Express answered 500 here.
            if ($e->getCode() !== '23000') {
                throw $e;
            }

            throw ValidationException::withMessages([
                'usuario' => 'No se puede eliminar el usuario porque tiene registros asociados.',
            ]);
        }
    }

    /**
     * `SELECT * FROM vw_carga_docente`. The view's key is `docente_id`; `id` is added because the
     * existing UI reads `d.id` (a latent Express bug where the dropdown value was undefined).
     *
     * @return array<int, array<string, mixed>>
     */
    public function docentes(): array
    {
        return DB::table('vw_carga_docente')
            ->orderBy('nombre_completo')
            ->get()
            ->map(fn ($r) => ['id' => $r->docente_id] + (array) $r)
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function opcionesTitulacion(): array
    {
        return DB::table('opciones_titulacion')
            ->where('activo', 1)
            ->orderBy('nombre')
            ->get(['id', 'nombre'])
            ->map(fn ($r) => (array) $r)
            ->all();
    }
}
