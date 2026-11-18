<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asignacion extends Model
{
    protected $table = 'asignaciones';

    protected $fillable = ['tramite_id', 'usuario_id', 'rol_asignacion', 'fecha_asignacion', 'activo'];

    protected function casts(): array
    {
        return [
            'fecha_asignacion' => 'datetime',
            'activo' => 'boolean',
        ];
    }

    public function tramite(): BelongsTo
    {
        return $this->belongsTo(Tramite::class, 'tramite_id');
    }

    public function docente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
