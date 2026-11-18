<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Documento extends Model
{
    protected $table = 'documentos';

    // `archivo_tamaño` contains a non-ASCII character in the existing schema.
    protected $fillable = [
        'tramite_id', 'tipo_documento_id', 'archivo_url', 'archivo_nombre', 'archivo_tamaño',
        'estatus', 'fecha_subida', 'revisado_por', 'fecha_revision', 'motivo_rechazo',
    ];

    protected function casts(): array
    {
        return [
            'archivo_tamaño' => 'integer',
            'fecha_subida' => 'datetime',
            'fecha_revision' => 'datetime',
        ];
    }

    public function tramite(): BelongsTo
    {
        return $this->belongsTo(Tramite::class, 'tramite_id');
    }

    public function tipoDocumento(): BelongsTo
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento_id');
    }

    public function revisor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'revisado_por');
    }

    public function historial(): HasMany
    {
        return $this->hasMany(HistorialEstado::class, 'documento_id');
    }
}
