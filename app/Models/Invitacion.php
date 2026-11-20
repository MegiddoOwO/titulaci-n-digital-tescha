<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Single-use, time-boxed invitation. Only the SHA-256 digest of the token is stored.
 */
class Invitacion extends Model
{
    public const ESTADO_PENDIENTE = 'pendiente';
    public const ESTADO_ACEPTADA = 'aceptada';
    public const ESTADO_EXPIRADA = 'expirada';
    public const ESTADO_REVOCADA = 'revocada';

    public const ESTADOS = [self::ESTADO_PENDIENTE, self::ESTADO_ACEPTADA, self::ESTADO_EXPIRADA, self::ESTADO_REVOCADA];

    protected $table = 'invitaciones';

    protected $fillable = [
        'token_hash', 'numero_control', 'email', 'nombre', 'apellido_paterno', 'apellido_materno', 'rol',
        'opcion_titulacion_id', 'asesor_id', 'grado_academico', 'carga_maxima', 'creada_por',
        'expira_en', 'aceptada_en', 'revocada_en', 'usuario_id',
    ];

    protected $hidden = ['token_hash'];

    protected $appends = ['estado'];

    protected function casts(): array
    {
        return [
            'carga_maxima' => 'integer',
            'expira_en' => 'datetime',
            'aceptada_en' => 'datetime',
            'revocada_en' => 'datetime',
        ];
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public function getEstadoAttribute(): string
    {
        return match (true) {
            $this->aceptada_en !== null => self::ESTADO_ACEPTADA,
            $this->revocada_en !== null => self::ESTADO_REVOCADA,
            $this->expira_en->isPast() => self::ESTADO_EXPIRADA,
            default => self::ESTADO_PENDIENTE,
        };
    }

    /** Not accepted, not revoked and not expired. */
    public function scopeVigente(Builder $query): Builder
    {
        return $query->whereNull('aceptada_en')->whereNull('revocada_en')->where('expira_en', '>', now());
    }

    public function scopeEnEstado(Builder $query, string $estado): Builder
    {
        return match ($estado) {
            self::ESTADO_ACEPTADA => $query->whereNotNull('aceptada_en'),
            self::ESTADO_REVOCADA => $query->whereNull('aceptada_en')->whereNotNull('revocada_en'),
            self::ESTADO_EXPIRADA => $query->whereNull('aceptada_en')->whereNull('revocada_en')->where('expira_en', '<=', now()),
            self::ESTADO_PENDIENTE => $query->vigente(),
            default => $query,
        };
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'creada_por');
    }

    public function asesor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'asesor_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function opcionTitulacion(): BelongsTo
    {
        return $this->belongsTo(OpcionTitulacion::class, 'opcion_titulacion_id');
    }
}
