<?php

namespace App\Actions\Admin;

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
 * Port of AdminRepository.emitirDictamen (record only; the PDF is rendered through
 * App\Contracts\DictamenPdfRenderer in T6).
 */
class EmitirDictamen
{
    public function __construct(
        private readonly NotificacionService $notificaciones,
        private readonly BitacoraService $bitacora,
    ) {}

    public function execute(int $tramiteId, string $resultado, string $observaciones, Usuario $admin): Dictamen
    {
        $tramite = Tramite::where('id', $tramiteId)->where('activo', 1)->first();

        if (! $tramite) {
            $this->fail('Trámite no encontrado.');
        }

        // A dictamen is final: re-emitting would silently overwrite the earlier resolution.
        if (Dictamen::where('tramite_id', $tramiteId)->exists()) {
            $this->fail('Este trámite ya tiene un dictamen emitido.');
        }

        if ($resultado === 'aprobado') {
            // Faithful: only documents that already have a row are considered (never-uploaded
            // mandatory types do not block approval in Express).
            $pending = Documento::query()
                ->where('tramite_id', $tramiteId)
                ->where('estatus', '!=', 'aprobado')
                ->whereHas('tipoDocumento', fn ($q) => $q->where('obligatorio', 1))
                ->with('tipoDocumento:id,nombre')
                ->get();

            if ($pending->isNotEmpty()) {
                $names = $pending->map(fn ($d) => $d->tipoDocumento->nombre)->implode(', ');
                $this->fail("No se puede aprobar el dictamen. Los siguientes documentos obligatorios no han sido aprobados: {$names}.");
            }
        }

        return DB::transaction(function () use ($tramite, $tramiteId, $resultado, $observaciones, $admin) {
            $dictamen = Dictamen::create([
                'tramite_id' => $tramiteId,
                'resultado' => $resultado,
                'observaciones' => $observaciones,
                'emitido_por' => $admin->id,
                'fecha_emision' => now(),
            ]);

            $previous = $tramite->estatus;
            $nuevo = $resultado === 'aprobado' ? 'completado' : 'rechazado';

            Tramite::whereKey($tramiteId)->update([
                'estatus' => $nuevo,
                'fecha_fin' => now(),
                'fecha_actualizacion' => now(),
            ]);

            $mensaje = $resultado === 'aprobado'
                ? 'Tu trámite de titulación ha sido APROBADO. Acude a ventanilla en horario 08:00–14:00 hrs para continuar.'
                : "Tu trámite fue rechazado. Motivo: {$observaciones}. Contacta a Control Escolar para más información.";

            $this->notificaciones->create(
                $tramite->usuario_id,
                $resultado === 'aprobado' ? 'Trámite Aprobado' : 'Trámite Rechazado',
                $mensaje,
                'ambos',
                $tramiteId,
            );

            $this->bitacora->log($admin->id, 'Emisión de dictamen', 'dictamenes', $tramiteId, [
                'resultado' => $resultado,
                'observaciones' => $observaciones,
            ]);

            HistorialEstado::create([
                'tramite_id' => $tramiteId,
                'documento_id' => null,
                'estado_anterior' => $previous,
                'estado_nuevo' => $nuevo,
                'comentario' => $observaciones,
                'usuario_id' => $admin->id,
            ]);

            return $dictamen;
        });
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['tramite_id' => $message]);
    }
}
