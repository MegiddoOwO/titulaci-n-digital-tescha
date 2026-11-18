<?php

namespace App\Services;

use App\Models\Tramite;
use App\Models\TipoDocumento;
use Illuminate\Support\Collection;

/**
 * Read model for the student dashboard. Port of MysqlTramiteRepository
 * (findByUsuarioId, getTramiteConDocumentos, getHistorial).
 */
class TramiteReadService
{
    public const NOT_FOUND = 'No se encontró un trámite activo para este usuario.';

    public function activeTramiteFor(int $usuarioId): ?Tramite
    {
        return Tramite::where('usuario_id', $usuarioId)
            ->where('activo', 1)
            ->orderByDesc('fecha_inicio')
            ->orderByDesc('id')
            ->first();
    }

    /**
     * Same shape as Express `GET /api/tramites/mi-tramite`.
     */
    public function detail(Tramite $tramite): array
    {
        $tramite->loadMissing('opcionTitulacion', 'progreso');

        $documentos = $this->documentos($tramite);

        $asignaciones = $tramite->asignaciones()
            ->where('activo', 1)
            ->with('docente')
            ->get()
            ->sortBy(fn ($a) => array_search($a->rol_asignacion, ['asesor', 'sinodal', 'revisor'], true))
            ->values()
            ->map(fn ($a) => [
                'rol_asignacion' => $a->rol_asignacion,
                'nombre' => $a->docente->nombre,
                'apellido_paterno' => $a->docente->apellido_paterno,
                'grado_academico' => $a->docente->grado_academico,
                'email' => $a->docente->email,
            ])->all();

        $dictamen = $tramite->dictamen()->with('emisor')->first();

        return [
            'id' => $tramite->id,
            'usuario_id' => $tramite->usuario_id,
            'opcion_titulacion_id' => $tramite->opcion_titulacion_id,
            'estatus' => $tramite->estatus,
            'fecha_inicio' => $tramite->fecha_inicio,
            'fecha_actualizacion' => $tramite->fecha_actualizacion,
            'fecha_fin' => $tramite->fecha_fin,
            'titulo_proyecto' => $tramite->titulo_proyecto,
            'activo' => (int) $tramite->activo,
            'opcion_titulacion' => $tramite->opcionTitulacion?->nombre ?? 'Desconocida',
            'fecha_limite' => $tramite->opcionTitulacion?->fecha_limite,
            'documentos' => $documentos->all(),
            'asignaciones' => $asignaciones,
            'dictamen' => $dictamen ? [
                'id' => $dictamen->id,
                'resultado' => $dictamen->resultado,
                'observaciones' => $dictamen->observaciones,
                'emitido_por' => trim($dictamen->emisor->nombre.' '.$dictamen->emisor->apellido_paterno),
                'fecha_emision' => $dictamen->fecha_emision,
            ] : null,
            'progreso' => $this->progreso($tramite),
        ];
    }

    /**
     * Same shape as Express `GET /api/tramites/:id/historial` (newest first).
     */
    public function historial(Tramite $tramite): array
    {
        return $tramite->historial()
            ->with('usuario')
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($h) => [
                'id' => $h->id,
                'tramite_id' => $h->tramite_id,
                'documento_id' => $h->documento_id,
                'estado_anterior' => $h->estado_anterior,
                'estado_nuevo' => $h->estado_nuevo,
                'comentario' => $h->comentario,
                'usuario_id' => $h->usuario_id,
                'usuario_nombre' => $h->usuario ? trim($h->usuario->nombre.' '.$h->usuario->apellido_paterno) : null,
                'fecha' => $h->fecha,
            ])->all();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function documentos(Tramite $tramite): Collection
    {
        $tipos = TipoDocumento::query()
            ->where('activo', 1)
            ->where(fn ($q) => $q->whereNull('opcion_titulacion_id')
                ->orWhere('opcion_titulacion_id', $tramite->opcion_titulacion_id))
            ->with(['prerrequisito', 'documentos' => fn ($q) => $q->where('tramite_id', $tramite->id)])
            ->orderBy('orden')
            ->get();

        $estatusByTipo = $tipos->mapWithKeys(
            fn ($t) => [$t->id => $t->documentos->first()?->estatus ?? 'pendiente']
        );

        return $tipos->map(function (TipoDocumento $tipo) use ($estatusByTipo) {
            $doc = $tipo->documentos->first();

            // Prerequisite lock (P-17).
            $bloqueado = false;
            $motivo = null;
            if ($tipo->prerrequisito_id && $estatusByTipo->has($tipo->prerrequisito_id)
                && $estatusByTipo[$tipo->prerrequisito_id] !== 'aprobado') {
                $bloqueado = true;
                $motivo = sprintf(
                    'El documento "%s" es prerrequisito. Cárguelo y espere su aprobación primero.',
                    $tipo->prerrequisito->nombre,
                );
            }

            return [
                'tipo_documento_id' => $tipo->id,
                'tipo_documento_nombre' => $tipo->nombre,
                'tipo_documento_obligatorio' => (int) $tipo->obligatorio,
                'prerrequisito_id' => $tipo->prerrequisito_id,
                'prerrequisito_nombre' => $tipo->prerrequisito?->nombre,
                'formato_permitido' => $tipo->formato_permitido,
                'tamaño_max_mb' => $tipo->tamaño_max_mb,
                'orden' => $tipo->orden,
                'id' => $doc?->id,
                'tramite_id' => $doc?->tramite_id,
                'archivo_url' => $doc?->archivo_url,
                'archivo_nombre' => $doc?->archivo_nombre,
                'archivo_tamaño' => $doc?->archivo_tamaño,
                'estatus' => $doc?->estatus ?? 'pendiente',
                'fecha_subida' => $doc?->fecha_subida,
                'revisado_por' => $doc?->revisado_por,
                'fecha_revision' => $doc?->fecha_revision,
                'motivo_rechazo' => $doc?->motivo_rechazo,
                'bloqueado' => $bloqueado,
                'motivo_bloqueo' => $motivo,
            ];
        })->values();
    }

    /**
     * Progress comes from the `vw_progreso_tramite` view, mapped to the Express shape.
     */
    private function progreso(Tramite $tramite): array
    {
        $p = $tramite->progreso;

        return [
            'total' => $p?->total_documentos ?? 0,
            'aprobados' => $p?->docs_aprobados ?? 0,
            'rechazados' => $p?->docs_rechazados ?? 0,
            'cargados' => $p?->docs_cargados ?? 0,
            'en_revision' => $p?->docs_en_revision ?? 0,
            'pendientes' => $p?->docs_pendientes ?? 0,
            'color_semaforo' => $p?->color_semaforo ?? 'ambar',
            'porcentaje' => $p?->porcentaje_avance ?? 0,
        ];
    }
}
