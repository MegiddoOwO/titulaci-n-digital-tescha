<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Adoption-safe: a database that already has the table is left untouched.
        if (Schema::hasTable('invitaciones')) {
            return;
        }

        DB::unprepared(<<<'SQL'
CREATE TABLE invitaciones (
    id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    token_hash            CHAR(64) NOT NULL UNIQUE COMMENT 'SHA-256 del token; el token plano nunca se guarda',
    numero_control        VARCHAR(20)  NOT NULL,
    email                 VARCHAR(120) NOT NULL,
    nombre                VARCHAR(80)  NOT NULL,
    apellido_paterno      VARCHAR(80)  NOT NULL,
    apellido_materno      VARCHAR(80)  NULL,
    rol                   ENUM('estudiante','asesor','administrativo') NOT NULL,
    opcion_titulacion_id  INT UNSIGNED NULL,
    asesor_id             INT UNSIGNED NULL,
    grado_academico       VARCHAR(80) NULL,
    carga_maxima          TINYINT UNSIGNED NULL,
    creada_por            INT UNSIGNED NOT NULL,
    expira_en             DATETIME NOT NULL,
    aceptada_en           DATETIME NULL,
    revocada_en           DATETIME NULL,
    usuario_id            INT UNSIGNED NULL COMMENT 'Cuenta creada al aceptar',
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_invitaciones_numero_control (numero_control),
    INDEX idx_invitaciones_email (email),
    INDEX idx_invitaciones_estado (aceptada_en, revocada_en, expira_en),

    CONSTRAINT fk_invitaciones_opcion FOREIGN KEY (opcion_titulacion_id) REFERENCES opciones_titulacion(id),
    CONSTRAINT fk_invitaciones_asesor FOREIGN KEY (asesor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_invitaciones_creada_por FOREIGN KEY (creada_por) REFERENCES usuarios(id),
    CONSTRAINT fk_invitaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
    }

    public function down(): void
    {
        $database = DB::connection()->getDatabaseName();
        if (! str_ends_with((string) $database, '_test')) {
            throw new \RuntimeException(
                "Refusing to drop [invitaciones] from [{$database}]: rollback is only allowed on databases ending with _test."
            );
        }

        Schema::dropIfExists('invitaciones');
    }
};
