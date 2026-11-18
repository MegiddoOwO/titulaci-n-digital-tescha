<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Normativa extends Model
{
    protected $table = 'normativa';

    protected $fillable = ['titulo', 'contenido', 'categoria', 'modalidad_id', 'orden', 'activo'];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'orden' => 'integer',
        ];
    }

    public function modalidad(): BelongsTo
    {
        return $this->belongsTo(OpcionTitulacion::class, 'modalidad_id');
    }
}
