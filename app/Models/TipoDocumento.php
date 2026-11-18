<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoDocumento extends Model
{
    protected $table = 'tipos_documento';

    // The column name contains a non-ASCII character in the existing schema.
    protected $fillable = [
        'nombre', 'descripcion', 'opcion_titulacion_id', 'obligatorio',
        'prerrequisito_id', 'formato_permitido', 'tamaño_max_mb', 'orden', 'activo',
    ];

    protected function casts(): array
    {
        return [
            'obligatorio' => 'boolean',
            'activo' => 'boolean',
            'tamaño_max_mb' => 'decimal:2',
            'orden' => 'integer',
        ];
    }

    public function opcionTitulacion(): BelongsTo
    {
        return $this->belongsTo(OpcionTitulacion::class, 'opcion_titulacion_id');
    }

    public function prerrequisito(): BelongsTo
    {
        return $this->belongsTo(self::class, 'prerrequisito_id');
    }

    public function dependientes(): HasMany
    {
        return $this->hasMany(self::class, 'prerrequisito_id');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class, 'tipo_documento_id');
    }
}
