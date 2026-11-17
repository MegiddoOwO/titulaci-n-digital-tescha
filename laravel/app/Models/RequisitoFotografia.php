<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequisitoFotografia extends Model
{
    protected $table = 'requisitos_fotografia';

    // Table only has created_at.
    public const UPDATED_AT = null;

    protected $fillable = ['descripcion', 'orden', 'activo'];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'orden' => 'integer',
        ];
    }
}
