<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tramite extends Model
{
    public const CREATED_AT = 'fecha_inicio';
    public const UPDATED_AT = 'fecha_actualizacion';

    protected $table = 'tramites';

    protected $fillable = [
        'usuario_id', 'opcion_titulacion_id', 'estatus', 'fecha_fin', 'titulo_proyecto', 'activo',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'datetime',
            'fecha_actualizacion' => 'datetime',
            'fecha_fin' => 'datetime',
            'activo' => 'boolean',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function opcionTitulacion(): BelongsTo
    {
        return $this->belongsTo(OpcionTitulacion::class, 'opcion_titulacion_id');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(Documento::class, 'tramite_id');
    }

    public function asignaciones(): HasMany
    {
        return $this->hasMany(Asignacion::class, 'tramite_id');
    }

    public function dictamen(): HasOne
    {
        return $this->hasOne(Dictamen::class, 'tramite_id');
    }

    public function historial(): HasMany
    {
        return $this->hasMany(HistorialEstado::class, 'tramite_id');
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class, 'tramite_id');
    }

    public function progreso(): HasOne
    {
        return $this->hasOne(VwProgresoTramite::class, 'tramite_id');
    }
}
