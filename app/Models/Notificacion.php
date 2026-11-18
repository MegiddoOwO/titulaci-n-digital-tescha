<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notificacion extends Model
{
    protected $table = 'notificaciones';

    // Table only has created_at.
    public const UPDATED_AT = null;

    protected $fillable = [
        'usuario_id', 'tipo', 'titulo', 'mensaje', 'leida', 'fecha_lectura', 'tramite_id',
    ];

    protected function casts(): array
    {
        return [
            'leida' => 'boolean',
            'fecha_lectura' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function tramite(): BelongsTo
    {
        return $this->belongsTo(Tramite::class, 'tramite_id');
    }
}
