<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;

class Usuario extends Authenticatable
{
    public const ROL_ESTUDIANTE = 'estudiante';
    public const ROL_ASESOR = 'asesor';
    public const ROL_ADMINISTRATIVO = 'administrativo';

    protected $table = 'usuarios';

    protected $fillable = [
        'numero_control', 'email', 'password_hash', 'nombre', 'apellido_paterno',
        'apellido_materno', 'rol', 'activo', 'intentos_fallidos', 'bloqueado_hasta',
        'grado_academico', 'carga_maxima', 'programa_academico', 'reset_token', 'reset_expira',
    ];

    protected $hidden = ['password_hash', 'reset_token'];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'intentos_fallidos' => 'integer',
            'carga_maxima' => 'integer',
            'bloqueado_hasta' => 'datetime',
            'reset_expira' => 'datetime',
        ];
    }

    /**
     * Login identifier is `numero_control` (institutional student/staff ID), not the email.
     */
    public function getAuthIdentifierName(): string
    {
        return 'id';
    }

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function getAuthPassword(): ?string
    {
        return $this->password_hash;
    }

    /**
     * The legacy table has no remember_token column; "remember me" is unsupported.
     */
    public function getRememberToken(): ?string
    {
        return null;
    }

    public function setRememberToken($value): void
    {
        // Intentionally a no-op.
    }

    public function getRememberTokenName(): string
    {
        return '';
    }

    /**
     * Landing path for the user's role after login.
     */
    public function homePath(): string
    {
        return match ($this->rol) {
            self::ROL_ASESOR => '/asesor',
            self::ROL_ADMINISTRATIVO => '/admin',
            default => '/dashboard',
        };
    }

    public function esEstudiante(): bool
    {
        return $this->rol === self::ROL_ESTUDIANTE;
    }

    public function esAsesor(): bool
    {
        return $this->rol === self::ROL_ASESOR;
    }

    public function esAdministrativo(): bool
    {
        return $this->rol === self::ROL_ADMINISTRATIVO;
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim(implode(' ', array_filter([
            $this->nombre, $this->apellido_paterno, $this->apellido_materno,
        ])));
    }

    /** Procedures started by this user (student). */
    public function tramites(): HasMany
    {
        return $this->hasMany(Tramite::class, 'usuario_id');
    }

    /** Advisor/panel assignments of this user (teacher). */
    public function asignaciones(): HasMany
    {
        return $this->hasMany(Asignacion::class, 'usuario_id');
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class, 'usuario_id');
    }

    public function consentimientos(): HasMany
    {
        return $this->hasMany(Consentimiento::class, 'usuario_id');
    }

    public function solicitudesArco(): HasMany
    {
        return $this->hasMany(SolicitudArco::class, 'usuario_id');
    }

    public function solicitudesArcoAtendidas(): HasMany
    {
        return $this->hasMany(SolicitudArco::class, 'atendido_por');
    }

    public function documentosRevisados(): HasMany
    {
        return $this->hasMany(Documento::class, 'revisado_por');
    }

    public function dictamenesEmitidos(): HasMany
    {
        return $this->hasMany(Dictamen::class, 'emitido_por');
    }

    public function bitacoras(): HasMany
    {
        return $this->hasMany(Bitacora::class, 'usuario_id');
    }
}
