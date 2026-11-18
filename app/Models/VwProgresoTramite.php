<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

/**
 * Read-only model over the `vw_progreso_tramite` database view.
 */
class VwProgresoTramite extends Model
{
    protected $table = 'vw_progreso_tramite';

    protected $primaryKey = 'tramite_id';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = ['*'];

    protected function casts(): array
    {
        return [
            'total_documentos' => 'integer',
            'docs_aprobados' => 'integer',
            'docs_rechazados' => 'integer',
            'docs_cargados' => 'integer',
            'docs_en_revision' => 'integer',
            'docs_pendientes' => 'integer',
            'porcentaje_avance' => 'float',
        ];
    }

    public function tramite(): BelongsTo
    {
        return $this->belongsTo(Tramite::class, 'tramite_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function save(array $options = []): never
    {
        throw new LogicException('vw_progreso_tramite is a read-only view.');
    }

    public function delete(): never
    {
        throw new LogicException('vw_progreso_tramite is a read-only view.');
    }
}
