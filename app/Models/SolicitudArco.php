<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudArco extends Model
{
    protected $table = 'solicitudes_arco';

    public $timestamps = false;

    protected $fillable = [
        'usuario_id', 'tipo', 'estado', 'detalle_solicitud', 'respuesta', 'atendido_por',
        'fecha_solicitud', 'fecha_resolucion',
    ];

    protected function casts(): array
    {
        return [
            'fecha_solicitud' => 'datetime',
            'fecha_resolucion' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function atendidoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'atendido_por');
    }
}
