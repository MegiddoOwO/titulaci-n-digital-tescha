<?php

namespace App\Actions\Documentos;

use App\Models\Dictamen;
use App\Models\Documento;
use App\Models\HistorialEstado;
use App\Models\Tramite;
use App\Models\Usuario;
use App\Services\BitacoraService;
use App\Services\NotificacionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Single implementation of AdminRepository.aprobarDocumento / rechazarDocumento, shared by the
 * asesor and admin controllers (authorization is decided by DocumentoPolicy::review).
 */
class ReviewDocumento
{
    public function __construct(
        private readonly NotificacionService $notificaciones,
        private readonly BitacoraService $bitacora,
    ) {}

    public function approve(Documento $documento, Usuario $reviewer): Documento
    {
        return DB::transaction(function () use ($documento, $reviewer) {
            // Business rule: only documents that were actually uploaded can be approved.
            if (! in_array($documento->estatus, ['cargado', 'en_revision'], true)) {
                throw ValidationException::withMessages([
                    'documento' => 'Solo se pueden aprobar documentos que ya fueron subidos.',
                ]);
            }

            $this->assertNoDictamen($documento);

            $previous = $documento->estatus;
            $tipo = $documento->tipoDocumento()->value('nombre');

            $documento->update([
                'estatus' => 'aprobado',
                'fecha_revision' => now(),
                'revisado_por' => $reviewer->id,
            ]);

            HistorialEstado::create([
                'tramite_id' => $documento->tramite_id,
                'documento_id' => $documento->id,
                'estado_anterior' => $previous,
                'estado_nuevo' => 'aprobado',
                'comentario' => 'Documento aprobado por administración.',
                'usuario_id' => $reviewer->id,
            ]);

            $this->notificaciones->create(
                $this->studentId($documento),
                'Documento Aprobado',
                "Tu documento \"{$tipo}\" ha sido aprobado por el comité de titulación.",
                'ambos',
                $documento->tramite_id,
            );

            $this->bitacora->log($reviewer->id, 'Aprobación de documento', 'documentos', $documento->id, [
                'tipo' => $tipo,
                'tramite_id' => $documento->tramite_id,
            ]);

            $this->recomputeTramiteStatus($documento->tramite_id);

            return $documento;
        });
    }

    public function reject(Documento $documento, Usuario $reviewer, string $motivo): Documento
    {
        return DB::transaction(function () use ($documento, $reviewer, $motivo) {
            // Business rule: only documents that were actually uploaded can be rejected.
            if (! in_array($documento->estatus, ['cargado', 'en_revision'], true)) {
                throw ValidationException::withMessages([
                    'documento' => 'Solo se pueden rechazar documentos que ya fueron subidos.',
                ]);
            }

            $this->assertNoDictamen($documento);

            $previous = $documento->estatus;
            $tipo = $documento->tipoDocumento()->value('nombre');

            $documento->update([
                'estatus' => 'rechazado',
                'motivo_rechazo' => $motivo,
                'fecha_revision' => now(),
                'revisado_por' => $reviewer->id,
            ]);

            HistorialEstado::create([
                'tramite_id' => $documento->tramite_id,
                'documento_id' => $documento->id,
                'estado_anterior' => $previous,
                'estado_nuevo' => 'rechazado',
                'comentario' => $motivo,
                'usuario_id' => $reviewer->id,
            ]);

            $this->notificaciones->create(
                $this->studentId($documento),
                'Documento Rechazado',
                "Tu documento \"{$tipo}\" fue rechazado. Motivo: {$motivo}",
                'ambos',
                $documento->tramite_id,
            );

            $this->bitacora->log($reviewer->id, 'Rechazo de documento', 'documentos', $documento->id, [
                'tipo' => $tipo,
                'tramite_id' => $documento->tramite_id,
                'motivo' => $motivo,
            ]);

            $this->recomputeTramiteStatus($documento->tramite_id);

            return $documento;
        });
    }

    /** A dictamen is final: the documents of its tramite can no longer be reviewed. */
    private function assertNoDictamen(Documento $documento): void
    {
        if (Dictamen::where('tramite_id', $documento->tramite_id)->exists()) {
            throw ValidationException::withMessages([
                'documento' => 'El trámite ya tiene un dictamen emitido; sus documentos no se pueden revisar.',
            ]);
        }
    }

    private function studentId(Documento $documento): int
    {
        return (int) Tramite::whereKey($documento->tramite_id)->value('usuario_id');
    }

    /**
     * Port of actualizarEstatusTramite. Faithful quirk: the "all approved" history row always
     * records `en_revision` as the previous state, whatever the tramite had before.
     */
    private function recomputeTramiteStatus(int $tramiteId): void
    {
        $estatuses = Documento::query()
            ->where('tramite_id', $tramiteId)
            ->whereHas('tipoDocumento', fn ($q) => $q->where('obligatorio', 1))
            ->pluck('estatus');

        $allApproved = $estatuses->isNotEmpty() && $estatuses->every(fn ($e) => $e === 'aprobado');
        $anyRejected = $estatuses->contains('rechazado');

        $nuevo = $allApproved ? 'aprobado' : ($anyRejected ? 'rechazado' : 'en_revision');

        Tramite::whereKey($tramiteId)->update(['estatus' => $nuevo, 'fecha_actualizacion' => now()]);

        if ($allApproved) {
            HistorialEstado::create([
                'tramite_id' => $tramiteId,
                'documento_id' => null,
                'estado_anterior' => 'en_revision',
                'estado_nuevo' => 'aprobado',
                'comentario' => 'Todos los documentos obligatorios aprobados.',
                'usuario_id' => null,
            ]);
        }
    }
}
