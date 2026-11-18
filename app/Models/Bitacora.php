<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bitacora extends Model
{
    protected $table = 'bitacora';

    public $timestamps = false;

    protected $fillable = [
        'usuario_id', 'accion', 'entidad', 'entidad_id', 'detalle', 'ip_origen', 'user_agent', 'fecha',
    ];

    protected function casts(): array
    {
        return [
            'detalle' => 'array',
            'fecha' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
