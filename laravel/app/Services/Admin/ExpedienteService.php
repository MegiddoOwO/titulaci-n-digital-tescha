<?php

namespace App\Services\Admin;

use App\Models\Tramite;
use App\Services\TramiteReadService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Port of AdminRepository expediente methods (listarExpedientes, getExpedienteDetalle,
 * actualizarTramite, toggleTramiteActivo).
 */
class ExpedienteService
{
    public function __construct(private readonly TramiteReadService $tramites) {}

    /**
     * @return array{expedientes: array<int, array<string, mixed>>, total: int, page: int, totalPages: int}
     */
    public function list(?string $search, ?string $estatus, int $page, int $limit): array
    {
        $base = DB::table('tramites as t')
            ->join('usuarios as u', 't.usuario_id', '=', 'u.id')
            ->where('t.activo', 1)
            ->where('u.rol', 'estudiante');

        if ($search) {
            $base->where(fn ($q) => $q->where('u.numero_control', 'like', "%{$search}%")
                ->orWhereRaw("CONCAT(u.nombre, ' ', u.apellido_paterno) LIKE ?", ["%{$search}%"]));
        }

        if ($estatus) {
            $base->where('t.estatus', $estatus);
        }

        $total = (clone $base)->count();

        $rows = $base
            ->join('opciones_titulacion as o', 't.opcion_titulacion_id', '=', 'o.id')
            ->leftJoin('vw_progreso_tramite as v', 't.id', '=', 'v.tramite_id')
            ->orderByDesc('t.fecha_actualizacion')
            ->offset(($page - 1) * $limit)
            ->limit($limit)
            ->selectRaw("t.id, u.numero_control,
                CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_completo,
                o.nombre AS opcion_titulacion,
                t.estatus, t.titulo_proyecto, t.fecha_inicio, t.fecha_actualizacion,
                COALESCE(v.total_documentos, 0) AS total_docs,
                COALESCE(v.docs_aprobados, 0) AS docs_aprobados,
                COALESCE(v.docs_rechazados, 0) AS docs_rechazados,
                COALESCE(v.docs_cargados, 0) AS docs_cargados,
                COALESCE(v.docs_en_revision, 0) AS docs_en_revision,
                COALESCE(v.color_semaforo, 'ambar') AS color_semaforo,
                COALESCE(v.porcentaje_avance, 0) AS porcentaje")
            ->get()
            ->map(fn ($r) => (array) $r + ['porcentaje' => (float) $r->porcentaje])
            ->all();

        return [
            'expedientes' => $rows,
            'total' => $total,
            'page' => $page,
            'totalPages' => (int) ceil($total / $limit),
        ];
    }

    public function find(int $id, bool $onlyActive = true): ?Tramite
    {
        $query = Tramite::whereKey($id);

        return $onlyActive ? $query->where('activo', 1)->first() : $query->first();
    }

    /**
     * Express admin detail: the student shape, but with every assignment (with its id, active or
     * not) and a progress block computed in memory with a rounded percentage.
     *
     * @return array<string, mixed>
     */
    public function detail(Tramite $tramite): array
    {
        $detail = $this->tramites->detail($tramite);

        $required = collect($detail['documentos'])->where('tipo_documento_obligatorio', 1);
        $count = fn (string $status) => $required->where('estatus', $status)->count();
        $total = $required->count();
        $approved = $count('aprobado');
        $rejected = $count('rechazado');

        $detail['progreso'] = [
            'total' => $total,
            'aprobados' => $approved,
            'rechazados' => $rejected,
            'cargados' => $count('cargado'),
            'en_revision' => $count('en_revision'),
            'pendientes' => $count('pendiente'),
            'color_semaforo' => $rejected > 0 ? 'rojo' : ($approved === $total ? 'verde' : 'ambar'),
            'porcentaje' => $total > 0 ? (int) round($approved / $total * 100) : 0,
        ];

        $detail['asignaciones'] = $tramite->asignaciones()
            ->with('docente')
            ->get()
            ->sortBy(fn ($a) => array_search($a->rol_asignacion, ['asesor', 'sinodal', 'revisor'], true))
            ->values()
            ->map(fn ($a) => [
                'id' => $a->id,
                'usuario_id' => $a->usuario_id,
                'rol_asignacion' => $a->rol_asignacion,
                'nombre' => $a->docente->nombre,
                'apellido_paterno' => $a->docente->apellido_paterno,
                'grado_academico' => $a->docente->grado_academico,
                'email' => $a->docente->email,
            ])->all();

        return $detail;
    }

    /**
     * @param  array<string, mixed>  $data  only the keys present are updated
     */
    public function update(Tramite $tramite, array $data): void
    {
        $fields = array_intersect_key($data, array_flip(['opcion_titulacion_id', 'titulo_proyecto']));

        if ($fields === []) {
            throw ValidationException::withMessages(['titulo_proyecto' => 'No hay campos para actualizar.']);
        }

        $tramite->update($fields);
    }

    /**
     * Cancel / reopen. Works on inactive tramites too (that is how they are reopened).
     */
    public function toggle(Tramite $tramite): int
    {
        $nuevo = $tramite->activo ? 0 : 1;
        $tramite->update(['activo' => $nuevo]);

        return $nuevo;
    }
}
