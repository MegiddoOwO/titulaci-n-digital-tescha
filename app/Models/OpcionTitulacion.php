<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OpcionTitulacion extends Model
{
    protected $table = 'opciones_titulacion';

    protected $fillable = ['nombre', 'fecha_limite', 'descripcion', 'activo'];

    protected function casts(): array
    {
        return [
            'fecha_limite' => 'date',
            'activo' => 'boolean',
        ];
    }

    public function tiposDocumento(): HasMany
    {
        return $this->hasMany(TipoDocumento::class, 'opcion_titulacion_id');
    }

    public function normativas(): HasMany
    {
        return $this->hasMany(Normativa::class, 'modalidad_id');
    }

    public function tramites(): HasMany
    {
        return $this->hasMany(Tramite::class, 'opcion_titulacion_id');
    }
}
