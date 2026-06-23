-- =============================================================================
-- SCA-ISC: Sistema de Control y Administración de Titulación
-- Base de Datos: MySQL / MariaDB
-- Motor: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS sca_tescha
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sca_tescha;

-- =============================================================================
-- 1. CATÁLOGOS
-- =============================================================================

-- 1.1 Opciones de Titulación (RF-06)
-- ---------------------------------------------------------------------------
CREATE TABLE opciones_titulacion (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL UNIQUE,
    fecha_limite    DATE NULL COMMENT 'Fecha límite para completar el trámite en esta opción',
    descripcion     TEXT,
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- 1.2 Tipos de Documento (RF-02, RF-03, RF-06)
--     Define qué documentos puede/debe subir el alumno según su opción.
--     prerrequisito_id fuerza el orden de carga (P-17).
-- ---------------------------------------------------------------------------
CREATE TABLE tipos_documento (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(150) NOT NULL,
    descripcion         TEXT,
    opcion_titulacion_id INT UNSIGNED NULL COMMENT 'NULL = aplica a todas las opciones',
    obligatorio         TINYINT(1) NOT NULL DEFAULT 1,
    prerrequisito_id    INT UNSIGNED NULL COMMENT 'Tipo de documento que debe cargarse antes (P-17)',
    formato_permitido   VARCHAR(50) NOT NULL DEFAULT 'PDF' COMMENT 'PDF, JPEG, PNG, etc.',
    tamaño_max_mb       DECIMAL(6,2) NOT NULL DEFAULT 10.00,
    orden               TINYINT UNSIGNED NOT NULL DEFAULT 0,
    activo              TINYINT(1) NOT NULL DEFAULT 1,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (opcion_titulacion_id) REFERENCES opciones_titulacion(id) ON DELETE SET NULL,
    FOREIGN KEY (prerrequisito_id)     REFERENCES tipos_documento(id)     ON DELETE SET NULL
) ENGINE=InnoDB;


-- 1.3 Normativa (RF-08)
--     Reglamentos, lineamientos y guías institucionales.
-- ---------------------------------------------------------------------------
CREATE TABLE normativa (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo          VARCHAR(200) NOT NULL,
    contenido       TEXT NOT NULL,
    categoria       VARCHAR(100) NULL COMMENT 'Ej: Requisitos Generales, Opciones, Docs Original vs Digital',
    modalidad_id    INT UNSIGNED NULL COMMENT 'Filtro por opción de titulación (P-36)',
    orden           TINYINT UNSIGNED NOT NULL DEFAULT 0,
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (modalidad_id) REFERENCES opciones_titulacion(id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- 1.4 Directorio Institucional (RF-07)
-- ---------------------------------------------------------------------------
CREATE TABLE directorio (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    cargo           VARCHAR(150) NOT NULL,
    departamento    VARCHAR(150) NOT NULL,
    email           VARCHAR(100) NULL,
    telefono        VARCHAR(20) NULL,
    extension       VARCHAR(10) NULL,
    orden           TINYINT UNSIGNED NOT NULL DEFAULT 0,
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================================
-- 2. ENTIDADES PRINCIPALES
-- =============================================================================

-- 2.1 Usuarios (RF-01)
--     Roles: estudiante | asesor | administrativo
--     Login con número de control, password encriptado con bcrypt/argon2 (P-03)
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero_control      VARCHAR(20)  NOT NULL UNIQUE COMMENT 'Matrícula institucional (P-01)',
    email               VARCHAR(120) NOT NULL UNIQUE COMMENT 'ej: 2021-0001@tescha.edu.mx (P-23)',
    password_hash       VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt/argon2 ≥ 60 chars (P-03)',
    nombre              VARCHAR(80)  NOT NULL,
    apellido_paterno    VARCHAR(80)  NOT NULL,
    apellido_materno    VARCHAR(80)  NULL,
    rol                 ENUM('estudiante','asesor','administrativo') NOT NULL,
    activo              TINYINT(1) NOT NULL DEFAULT 1,

    -- Bloqueo por intentos fallidos (P-04)
    intentos_fallidos   TINYINT UNSIGNED NOT NULL DEFAULT 0,
    bloqueado_hasta     DATETIME NULL,

    -- Campos específicos para docentes/asesores
    grado_academico     VARCHAR(80) NULL COMMENT 'Ej: Mtra., Dr., Ing.',
    carga_maxima        TINYINT UNSIGNED NULL DEFAULT 5 COMMENT 'Máx asesorías simultáneas (P-26)',

    -- Campos específicos para estudiantes
    programa_academico  VARCHAR(100) NULL DEFAULT 'Ingeniería en Sistemas Computacionales',
    reset_token         VARCHAR(255) NULL,
    reset_expira        DATETIME NULL,

    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_usuarios_rol (rol),
    INDEX idx_usuarios_activo (activo)
) ENGINE=InnoDB;


-- 2.2 Trámites / Expedientes (RF-04)
--     Cada estudiante inicia un trámite con una opción de titulación.
--     El semáforo se deriva del estado general (P-18, P-19, P-20).
-- ---------------------------------------------------------------------------
CREATE TABLE tramites (
    id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id              INT UNSIGNED NOT NULL COMMENT 'Estudiante',
    opcion_titulacion_id    INT UNSIGNED NOT NULL,
    estatus                 ENUM('en_proceso','en_revision','aprobado','rechazado','completado') NOT NULL DEFAULT 'en_proceso',
    fecha_inicio            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    fecha_fin               TIMESTAMP NULL,
    titulo_proyecto         VARCHAR(300) NULL COMMENT 'Título de tesis o memoria (P-15)',
    activo                  TINYINT(1) NOT NULL DEFAULT 1,

    FOREIGN KEY (usuario_id)            REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (opcion_titulacion_id)   REFERENCES opciones_titulacion(id) ON DELETE RESTRICT,

    INDEX idx_tramites_usuario (usuario_id),
    INDEX idx_tramites_estatus (estatus),
    INDEX idx_tramites_activo (activo)
) ENGINE=InnoDB;


-- 2.3 Documentos (RF-02, RF-03, RF-06)
--     Archivos subidos por el alumno, asociados a su trámite.
-- ---------------------------------------------------------------------------
CREATE TABLE documentos (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tramite_id          INT UNSIGNED NOT NULL,
    tipo_documento_id   INT UNSIGNED NOT NULL,
    archivo_url         VARCHAR(500) NULL COMMENT 'Ruta en sistema de archivos / storage',
    archivo_nombre      VARCHAR(255) NULL COMMENT 'Nombre original del archivo',
    archivo_tamaño      INT UNSIGNED NULL COMMENT 'Tamaño en bytes',
    estatus             ENUM('pendiente','cargado','en_revision','aprobado','rechazado') NOT NULL DEFAULT 'pendiente',
    fecha_subida        TIMESTAMP NULL,
    revisado_por        INT UNSIGNED NULL COMMENT 'Usuario administrativo que revisó',
    fecha_revision      TIMESTAMP NULL,
    motivo_rechazo      TEXT NULL COMMENT 'Justificación del rechazo (P-30)',
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tramite_id)        REFERENCES tramites(id)        ON DELETE CASCADE,
    FOREIGN KEY (tipo_documento_id) REFERENCES tipos_documento(id) ON DELETE RESTRICT,
    FOREIGN KEY (revisado_por)      REFERENCES usuarios(id)        ON DELETE SET NULL,

    INDEX idx_documentos_tramite (tramite_id),
    INDEX idx_documentos_estatus (estatus),
    INDEX idx_documentos_tipo    (tipo_documento_id),
    UNIQUE KEY uq_documento_tramite_tipo (tramite_id, tipo_documento_id)
) ENGINE=InnoDB;


-- 2.4 Asignaciones de Docentes (RF-10)
--     Vincula docentes a trámites como asesor o sinodal.
-- ---------------------------------------------------------------------------
CREATE TABLE asignaciones (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tramite_id      INT UNSIGNED NOT NULL,
    usuario_id      INT UNSIGNED NOT NULL COMMENT 'Docente/Asesor',
    rol_asignacion  ENUM('asesor','sinodal','revisor') NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tramite_id) REFERENCES tramites(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,

    UNIQUE KEY uq_asignacion_tramite_docente_rol (tramite_id, usuario_id, rol_asignacion),
    INDEX idx_asignaciones_tramite (tramite_id),
    INDEX idx_asignaciones_docente (usuario_id),
    INDEX idx_asignaciones_activo (activo)
) ENGINE=InnoDB;


-- 2.5 Dictámenes (Módulo 5)
--     Emisión oficial de resultado del trámite (P-29, P-30).
-- ---------------------------------------------------------------------------
CREATE TABLE dictamenes (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tramite_id      INT UNSIGNED NOT NULL UNIQUE COMMENT 'Un trámite → un dictamen',
    resultado       ENUM('aprobado','rechazado') NOT NULL,
    observaciones   TEXT NULL COMMENT 'Observaciones generales del dictamen (P-30)',
    emitido_por     INT UNSIGNED NOT NULL COMMENT 'Usuario administrativo',
    fecha_emision   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tramite_id)  REFERENCES tramites(id) ON DELETE CASCADE,
    FOREIGN KEY (emitido_por) REFERENCES usuarios(id) ON DELETE RESTRICT,

    INDEX idx_dictamenes_fecha (fecha_emision)
) ENGINE=InnoDB;

-- =============================================================================
-- 3. TRAZABILIDAD Y AUDITORÍA
-- =============================================================================

-- 3.1 Historial de Estados / Línea de Tiempo (Módulo 3, P-21)
--     Registra cada cambio de estado de documentos y trámites.
--     Visible para el estudiante como línea de tiempo.
-- ---------------------------------------------------------------------------
CREATE TABLE historial_estados (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tramite_id      INT UNSIGNED NOT NULL,
    documento_id    INT UNSIGNED NULL COMMENT 'NULL si el cambio es a nivel trámite',
    estado_anterior VARCHAR(50) NULL,
    estado_nuevo    VARCHAR(50) NOT NULL,
    comentario      TEXT NULL,
    usuario_id      INT UNSIGNED NULL COMMENT 'Usuario que realizó la acción',
    fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tramite_id)   REFERENCES tramites(id)   ON DELETE CASCADE,
    FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)   ON DELETE SET NULL,

    INDEX idx_historial_tramite (tramite_id),
    INDEX idx_historial_fecha   (fecha)
) ENGINE=InnoDB;


-- 3.2 Bitácora de Auditoría (P-09)
--     Registro de seguridad: toda acción administrativa queda registrada.
-- ---------------------------------------------------------------------------
CREATE TABLE bitacora (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT UNSIGNED NULL COMMENT 'Usuario que ejecutó la acción',
    accion          VARCHAR(100) NOT NULL COMMENT 'Ej: Aprobación de expediente, Login fallido',
    entidad         VARCHAR(50)  NULL COMMENT 'Tabla o entidad afectada',
    entidad_id      INT UNSIGNED NULL COMMENT 'ID del registro afectado',
    detalle         JSON NULL COMMENT 'Datos adicionales en formato JSON',
    ip_origen       VARCHAR(45) NULL,
    user_agent      VARCHAR(500) NULL,
    fecha           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,

    INDEX idx_bitacora_usuario (usuario_id),
    INDEX idx_bitacora_fecha   (fecha),
    INDEX idx_bitacora_accion  (accion)
) ENGINE=InnoDB;

-- =============================================================================
-- 4. NOTIFICACIONES
-- =============================================================================

-- 4.1 Notificaciones (RF-09)
--     In-app y registro de emails enviados (P-23, P-24).
-- ---------------------------------------------------------------------------
CREATE TABLE notificaciones (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT UNSIGNED NOT NULL,
    tipo            ENUM('in_app','email','ambos') NOT NULL DEFAULT 'in_app',
    titulo          VARCHAR(200) NOT NULL,
    mensaje         TEXT NOT NULL,
    leida           TINYINT(1) NOT NULL DEFAULT 0,
    fecha_lectura   TIMESTAMP NULL,
    tramite_id      INT UNSIGNED NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (tramite_id) REFERENCES tramites(id) ON DELETE SET NULL,

    INDEX idx_notificaciones_usuario (usuario_id),
    INDEX idx_notificaciones_leida   (usuario_id, leida),
    INDEX idx_notificaciones_fecha   (created_at)
) ENGINE=InnoDB;

-- =============================================================================
-- 5. PRIVACIDAD (LGPDPPSO — Módulo 8)
-- =============================================================================

-- 5.1 Consentimientos de Privacidad (P-49)
--     Aviso de privacidad obligatorio en primer inicio de sesión.
-- ---------------------------------------------------------------------------
CREATE TABLE consentimientos (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT UNSIGNED NOT NULL,
    version_aviso   VARCHAR(20) NOT NULL DEFAULT '1.0',
    ip_origen       VARCHAR(45) NULL,
    user_agent      VARCHAR(500) NULL,
    fecha_consentimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,

    INDEX idx_consentimientos_usuario (usuario_id)
) ENGINE=InnoDB;


-- 5.2 Solicitudes ARCO (P-50)
--     Acceso, Rectificación, Cancelación, Oposición de datos personales.
-- ---------------------------------------------------------------------------
CREATE TABLE solicitudes_arco (
    id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id          INT UNSIGNED NOT NULL,
    tipo                ENUM('acceso','rectificacion','cancelacion','oposicion') NOT NULL,
    estado              ENUM('pendiente','en_proceso','completada','rechazada') NOT NULL DEFAULT 'pendiente',
    detalle_solicitud   TEXT NULL,
    respuesta           TEXT NULL,
    atendido_por        INT UNSIGNED NULL,
    fecha_solicitud     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion    TIMESTAMP NULL,

    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (atendido_por)  REFERENCES usuarios(id) ON DELETE SET NULL,

    INDEX idx_arco_usuario (usuario_id),
    INDEX idx_arco_estado  (estado)
) ENGINE=InnoDB;

-- =============================================================================
-- 6. MÓDULO DE FOTOGRAFÍA (checklist opcional, P-38)
-- =============================================================================

-- 6.1 Requisitos de Fotografía
--     Los 12 requisitos que el alumno debe confirmar antes de subir su foto.
-- ---------------------------------------------------------------------------
CREATE TABLE requisitos_fotografia (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    descripcion     VARCHAR(300) NOT NULL COMMENT 'Ej: "Fondo mate, sin brillos"',
    orden           TINYINT UNSIGNED NOT NULL DEFAULT 0,
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =============================================================================
-- 7. VISTAS ÚTILES
-- =============================================================================

-- 7.1 Vista: carga actual de cada docente (para validación P-25, P-26)
-- ---------------------------------------------------------------------------
CREATE VIEW vw_carga_docente AS
SELECT
    u.id                        AS docente_id,
    u.numero_control            AS numero_control,
    CONCAT_WS(' ', u.grado_academico, u.nombre, u.apellido_paterno, u.apellido_materno) AS nombre_completo,
    u.carga_maxima,
    COUNT(CASE WHEN a.activo = 1 THEN 1 END) AS carga_actual
FROM usuarios u
LEFT JOIN asignaciones a ON u.id = a.usuario_id AND a.activo = 1
WHERE u.rol = 'asesor' AND u.activo = 1
GROUP BY u.id, u.numero_control, u.nombre, u.apellido_paterno, u.apellido_materno, u.grado_academico, u.carga_maxima;


-- 7.2 Vista: progreso del trámite (para semáforo y barra de progreso P-22)
-- ---------------------------------------------------------------------------
CREATE VIEW vw_progreso_tramite AS
SELECT
    t.id                            AS tramite_id,
    t.usuario_id,
    t.estatus                       AS estatus_tramite,
    COUNT(d.id)                     AS total_documentos,
    COUNT(CASE WHEN d.estatus = 'aprobado'     THEN 1 END) AS docs_aprobados,
    COUNT(CASE WHEN d.estatus = 'rechazado'    THEN 1 END) AS docs_rechazados,
    COUNT(CASE WHEN d.estatus = 'cargado'      THEN 1 END) AS docs_cargados,
    COUNT(CASE WHEN d.estatus = 'en_revision'  THEN 1 END) AS docs_en_revision,
    COUNT(CASE WHEN d.estatus = 'pendiente'    THEN 1 END) AS docs_pendientes,
    CASE
        WHEN COUNT(CASE WHEN d.estatus = 'rechazado' THEN 1 END) > 0 THEN 'rojo'
        WHEN COUNT(CASE WHEN d.estatus IN ('pendiente','cargado','en_revision') THEN 1 END) > 0 THEN 'ambar'
        WHEN COUNT(CASE WHEN d.estatus = 'aprobado' THEN 1 END) = COUNT(d.id) THEN 'verde'
        ELSE 'ambar'
    END                             AS color_semaforo,
    CASE
        WHEN COUNT(d.id) > 0
        THEN ROUND(COUNT(CASE WHEN d.estatus = 'aprobado' THEN 1 END) * 100.0 / COUNT(d.id), 1)
        ELSE 0
    END                             AS porcentaje_avance
FROM tramites t
LEFT JOIN documentos d ON t.id = d.tramite_id
GROUP BY t.id, t.usuario_id, t.estatus;

-- =============================================================================
-- FIN DEL ESQUEMA
-- =============================================================================
