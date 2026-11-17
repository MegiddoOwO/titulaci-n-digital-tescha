<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Directorio extends Model
{
    protected $table = 'directorio';

    protected $fillable = [
        'nombre', 'cargo', 'departamento', 'email', 'telefono', 'extension', 'orden', 'activo',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'orden' => 'integer',
        ];
    }
}
