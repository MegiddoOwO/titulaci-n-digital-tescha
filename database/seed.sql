-- =============================================================================
-- SCA-ISC: Seed Data para desarrollo
-- Los passwords deben generarse con bcrypt desde la aplicación.
-- Los hashes de abajo corresponden a bcrypt(contraseña, 12 rondas).
-- =============================================================================

USE sca_tescha;

-- =============================================================================
-- 1. CATÁLOGOS
-- =============================================================================

-- 1.1 Opciones de Titulación
-- ---------------------------------------------------------------------------
INSERT INTO opciones_titulacion (id, nombre, descripcion) VALUES
(1, 'Tesis',
 'Desarrollo de un proyecto de investigación aplicada bajo la dirección de un asesor.'),
(2, 'Residencias Profesionales',
 'Memoria de residencia profesional más carta de aceptación de la empresa.'),
(3, 'Excelencia Académica',
 'Promedio sobresaliente (≥ 9.5) cursando el total de créditos en la institución.'),
(4, 'Examen General de Egreso (EGEL)',
 'Acreditación del EGEL-CENEVAL con testimonio de desempeño sobresaliente.'),
(5, 'Créditos de Posgrado',
 'Acreditación de al menos 2 asignaturas de un programa de posgrado afín.');


-- 1.2 Tipos de Documento
--     NOTA: prerrequisito_id fuerza el orden de carga (P-17):
--     El Certificado Total de Estudios es prerrequisito de la Solicitud de Titulación.
-- ---------------------------------------------------------------------------
INSERT INTO tipos_documento (id, nombre, descripcion, opcion_titulacion_id, obligatorio,
                             prerrequisito_id, formato_permitido, tamaño_max_mb, orden) VALUES
-- Documentos comunes a todas las opciones
(1,  'Certificado Total de Estudios',
     'Certificado oficial de estudios de licenciatura emitido por Control Escolar.',
     NULL, 1, NULL, 'PDF', 10, 1),

(2,  'Constancia de Liberación de Lenguas Extranjeras',
     'Constancia emitida por la Coordinación de Lenguas Extranjeras que acredita el nivel de inglés.',
     NULL, 1, NULL, 'PDF', 10, 2),

(3,  'Fotografía tamaño miñón',
     '5 fotografías tamaño miñón con especificaciones oficiales: saco oscuro, camisa blanca, fondo mate, sin maquillaje.',
     NULL, 1, NULL, 'JPEG,PNG', 5, 3),

(4,  'Comprobante de Pago de Derechos de Titulación',
     'Línea de captura o comprobante de pago del portal estatal (18 dígitos de referencia).',
     NULL, 1, NULL, 'PDF', 10, 4),

(5,  'Solicitud de Titulación',
     'Formato oficial de solicitud de titulación firmado.',
     NULL, 1, 1, 'PDF', 10, 10),

-- Documentos específicos por opción de titulación
-- Tesis
(10, 'Documento de Tesis',
     'Documento completo de tesis en formato PDF.',
     1, 1, NULL, 'PDF', 15, 5),

(11, 'Carta de Aceptación de Asesor de Tesis',
     'Carta firmada por el asesor aceptando dirigir la tesis.',
     1, 1, NULL, 'PDF', 10, 6),

-- Residencias Profesionales
(20, 'Memoria de Residencias Profesionales',
     'Documento que describe el proyecto realizado durante la residencia.',
     2, 1, NULL, 'PDF', 15, 5),

(21, 'Carta de Aceptación de la Empresa',
     'Carta membretada de la empresa que acredita la residencia profesional.',
     2, 1, NULL, 'PDF', 10, 6),

-- Excelencia Académica
(30, 'Constancia de Promedio',
     'Constancia oficial del promedio general emitida por Control Escolar.',
     3, 1, NULL, 'PDF', 10, 5),

(31, 'Carta de No Adeudo',
     'Carta que acredita que el alumno no tiene adeudos en ninguna área.',
     3, 1, NULL, 'PDF', 10, 6);


-- 1.3 Normativa
-- ---------------------------------------------------------------------------
INSERT INTO normativa (titulo, contenido, categoria, modalidad_id, orden) VALUES

('Requisitos Generales de Titulación',
 '## Requisitos Generales\n\nPara iniciar el trámite de titulación, el egresado deberá cumplir con los siguientes requisitos:\n\n1. Haber acreditado el 100% de los créditos del plan de estudios.\n2. Haber cumplido con el Servicio Social.\n3. No tener adeudos en ninguna área del plantel (Biblioteca, Centro de Información, Finanzas, etc.).\n4. Tener liberado el idioma inglés por la Coordinación de Lenguas Extranjeras.',
 'Requisitos Generales', NULL, 1),

('Modalidades de Titulación',
 '## Modalidades de Titulación\n\nEl TESCHA ofrece las siguientes opciones para obtener el título profesional:\n\n1. **Tesis** — Desarrollo de un proyecto de investigación.\n2. **Residencias Profesionales** — Memoria de proyecto en empresa.\n3. **Excelencia Académica** — Promedio ≥ 9.5.\n4. **EGEL-CENEVAL** — Testimonio sobresaliente.\n5. **Créditos de Posgrado** — Al menos 2 asignaturas acreditadas.',
 'Opciones de Titulación', NULL, 2),

('Documentación: Original vs Digital',
 '## Documentos Originales vs Copias\n\n| Documento | Formato de entrega |\n|-----------|-------------------|\n| Certificado Total de Estudios | Original físico + copia digital PDF |\n| Constancia de Inglés | Original físico + copia digital PDF |\n| Fotografías | Original físico (5 fotos miñón) + escaneo digital |\n| Comprobante de pago | Copia digital PDF |\n| Tesis/Memoria | Digital PDF + CD empastado (entrega física) |',
 'Docs Original vs Digital', NULL, 3),

('Especificaciones Técnicas de Documentos',
 '## Especificaciones Técnicas\n\n### Fotografías\n- Tamaño miñón (4.5 × 3.5 cm)\n- 5 fotografías idénticas\n- Fondo blanco mate (sin brillos)\n- Camisa blanca y saco oscuro\n- Sin maquillaje, sin patillas, sin lentes\n- Frente completamente descubierta\n- Sin retoques digitales\n- Iluminación uniforme\n- Pose frontal\n- Papel fotográfico mate (no brillante)\n\n### Documentos PDF\n- Resolución mínima: 300 ppp\n- Tamaño máximo: 10 MB por archivo\n- No se aceptan archivos corruptos\n- No se aceptan PDFs protegidos con contraseña',
 'Especificaciones Técnicas', NULL, 4),

('Lineamientos Específicos para Tesis',
 '## Tesis\n\n### Requisitos adicionales\n1. Documento de tesis completo en formato PDF.\n2. Carta de aceptación del asesor de tesis.\n3. El asesor debe ser un docente activo de la división ISC.\n4. Se requieren 3 sinodales para el examen profesional.\n5. El documento debe seguir el formato institucional de tesis.',
 'Opciones de Titulación', 1, 5),

('Lineamientos para Residencias Profesionales',
 '## Residencias Profesionales\n\n### Requisitos adicionales\n1. Memoria de residencias profesionales en PDF.\n2. Carta membretada de aceptación de la empresa.\n3. La residencia debe tener una duración mínima de 500 horas.\n4. El proyecto debe estar relacionado con el perfil de egreso de ISC.',
 'Opciones de Titulación', 2, 6);


-- 1.4 Directorio Institucional (RF-07, P-33)
-- ---------------------------------------------------------------------------
INSERT INTO directorio (nombre, cargo, departamento, email, extension, orden) VALUES
('Dr. Juan Carlos Pérez Hernández',        'Director General',
 'Dirección General',                       'direccion@tescha.edu.mx',           '1001', 1),
('Mtra. Ana Laura Sánchez Morales',         'Directora Académica',
 'Dirección Académica',                     'academica@tescha.edu.mx',           '1002', 2),
('Mtra. Niza Lucero Alpízar Martínez',      'Jefa de División ISC',
 'Jefatura de Ingeniería en Sistemas',      'niza.alpizar@tescha.edu.mx',        '1010', 3),
('Mtra. Gabriela Hernández López',          'Coordinadora de Lenguas Extranjeras',
 'Coordinación de Lenguas Extranjeras',     'lenguas@tescha.edu.mx',             '1020', 4),
('Lic. Roberto Manuel Ávila Castro',        'Jefe de Control Escolar',
 'Control Escolar',                         'control.escolar@tescha.edu.mx',     '1030', 5),
('Lic. Sandra López García',                'Encargada del Centro de Información',
 'Centro de Información',                   'biblioteca@tescha.edu.mx',          '1040', 6);


-- 1.5 Requisitos de Fotografía (P-38)
--     Los 12 requisitos que el alumno debe confirmar (checklist).
-- ---------------------------------------------------------------------------
INSERT INTO requisitos_fotografia (descripcion, orden) VALUES
('Tamaño miñón (4.5 × 3.5 cm)',                                   1),
('Fondo blanco mate (sin brillos ni sombras)',                    2),
('Camisa blanca formal',                                          3),
('Saco oscuro (negro o azul marino)',                             4),
('Sin maquillaje visible',                                        5),
('Sin patillas largas (corte escolar)',                           6),
('Sin lentes (ni oscuros ni de aumento)',                         7),
('Frente completamente descubierta (sin fleco sobre cejas)',      8),
('Sin retoques digitales ni filtros',                             9),
('Iluminación uniforme (sin sombras en el rostro)',               10),
('Pose frontal (mirando directamente a la cámara)',               11),
('Papel fotográfico mate (no brillante)',                         12);


-- =============================================================================
-- 2. USUARIOS
--    Passwords: todos usan "Demo1234!" como contraseña de prueba.
--    Hash bcrypt generado con 12 rondas de sal.
--    Para generar nuevos hashes usar: bcrypt.hashSync("contraseña", 12)
-- =============================================================================

INSERT INTO usuarios (id, numero_control, email, password_hash, nombre, apellido_paterno, apellido_materno, rol, grado_academico, carga_maxima) VALUES
-- Estudiantes (P-01: 2021-0001)
(1, '2021-0001', '2021-0001@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Ian Alexis',        'Flores',       'Martinez',     'estudiante',      NULL, NULL),
(2, '2021-0002', '2021-0002@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Juan Esteban',      'Anzures',      'Campos',       'estudiante',      NULL, NULL),
(3, '2021-0003', '2021-0003@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Miguel Ángel',      'Jurado',       'Delgadillo',   'estudiante',      NULL, NULL),
(4, '2021-0004', '2021-0004@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Juan Fernando',     'Reyes',        'Arguello',     'estudiante',      NULL, NULL),
(5, '2021-0005', '2021-0005@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Brayan Uriel',      'Villegas',     'Raymundo',     'estudiante',      NULL, NULL),

-- Docentes / Asesores
(10, 'DOC-0001', 'niza.alpizar@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Niza Lucero',       'Alpízar',      'Martínez',     'asesor',          'Mtra.',  5),
(11, 'DOC-0002', 'javier.garcia@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Javier',            'García',       'Hernández',    'asesor',          'Dr.',    5),
(12, 'DOC-0003', 'laura.ramirez@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Laura',             'Ramírez',      'Soto',         'asesor',          'Ing.',   5),
(13, 'DOC-0004', 'carlos.mendoza@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Carlos',            'Mendoza',      'López',        'asesor',          'Mtro.',  5),
(14, 'DOC-0005', 'patricia.diaz@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Patricia',          'Díaz',         'Torres',       'asesor',          'Dra.',   5),
(15, 'DOC-0006', 'roberto.sanchez@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Roberto',           'Sánchez',      'Ruiz',         'asesor',          'Mtro.',  5),

-- Administrativos (P-09: A001)
(20, 'ADM-0001', 'admin.titulacion@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'Ricardo',           'López',        'García',       'administrativo',  NULL, NULL),
(21, 'ADM-0002', 'control.escolar@tescha.edu.mx',
 '$2b$12$BL9YUgX132McptL3.lPgrun.VeGnX/BCGD3bxmcEk2TEj/u7EWjVe',
 'María Elena',       'González',     'Vázquez',      'administrativo',  NULL, NULL);


-- =============================================================================
-- 3. TRÁMITES (Expedientes)
-- =============================================================================

-- Estudiante 1 (2021-0001): Tesis — trámite en revisión (P-01)
INSERT INTO tramites (id, usuario_id, opcion_titulacion_id, estatus, titulo_proyecto) VALUES
(1, 1, 1, 'en_revision',
 'Sistema Web de Control y Administración de Titulación para TESCHA ISC');

-- Estudiante 2 (2021-0002): Residencias — en proceso
INSERT INTO tramites (id, usuario_id, opcion_titulacion_id, estatus, titulo_proyecto) VALUES
(2, 2, 2, 'en_proceso',
 'Desarrollo de Aplicación Móvil para Trazabilidad de Entregas en Empresa Logística');

-- Estudiante 3 (2021-0003): Excelencia — pendiente documentos iniciales
INSERT INTO tramites (id, usuario_id, opcion_titulacion_id, estatus, titulo_proyecto) VALUES
(3, 3, 3, 'en_proceso', NULL);

-- Estudiante 4 (2021-0004): Tesis — aprobado (P-19)
INSERT INTO tramites (id, usuario_id, opcion_titulacion_id, estatus, titulo_proyecto) VALUES
(4, 4, 1, 'aprobado',
 'Análisis de Seguridad en Redes IoT para el Sector Industrial');

-- Estudiante 5 (2021-0005): Tesis — rechazado (P-20)
INSERT INTO tramites (id, usuario_id, opcion_titulacion_id, estatus, titulo_proyecto) VALUES
(5, 5, 1, 'rechazado',
 'Implementación de Algoritmos de Machine Learning para Predicción de Deserción');


-- =============================================================================
-- 4. DOCUMENTOS
-- =============================================================================

-- Trámite 1 (2021-0001, Tesis, en_revision)
-- Algunos docs aprobados, otros en revisión.
INSERT INTO documentos (id, tramite_id, tipo_documento_id, archivo_nombre, archivo_tamaño, estatus, fecha_subida, revisado_por, fecha_revision) VALUES
(1,  1, 1,  'certificado_20210001.pdf',    1572864, 'aprobado',    '2026-05-10 10:30:00', 20, '2026-05-11 09:15:00'),
(2,  1, 2,  'ingles_20210001.pdf',          838860,  'aprobado',    '2026-05-10 10:35:00', 20, '2026-05-11 09:20:00'),
(3,  1, 3,  'foto_20210001.jpg',            524288,  'en_revision', '2026-05-10 10:40:00', NULL, NULL),
(4,  1, 4,  'pago_20210001.pdf',            419430,  'cargado',     '2026-05-12 08:00:00', NULL, NULL),
(5,  1, 10, 'tesis_20210001.pdf',          3145728,  'cargado',     '2026-05-15 14:20:00', NULL, NULL),
(6,  1, 11, 'carta_asesor_20210001.pdf',    209715,  'pendiente',   NULL, NULL, NULL),
(7,  1, 5,  'solicitud_20210001.pdf',       307200,  'pendiente',   NULL, NULL, NULL);

-- Trámite 2 (2021-0002, Residencias, en_proceso)
INSERT INTO documentos (id, tramite_id, tipo_documento_id, archivo_nombre, archivo_tamaño, estatus, fecha_subida) VALUES
(8,  2, 1,  'certificado_20210002.pdf',    1200000, 'cargado',    '2026-05-20 09:00:00'),
(9,  2, 2,  'ingles_20210002.pdf',           950000, 'pendiente',  NULL),
(10, 2, 3,  'foto_20210002.jpg',             480000, 'pendiente',  NULL),
(11, 2, 4,  'pago_20210002.pdf',             350000, 'pendiente',  NULL),
(12, 2, 20, 'memoria_residencias_20210002.pdf', 2500000, 'pendiente', NULL),
(13, 2, 21, 'carta_empresa_20210002.pdf',     307200, 'pendiente', NULL),
(14, 2, 5,  'solicitud_20210002.pdf',         280000, 'pendiente', NULL);

-- Trámite 3 (2021-0003, Excelencia, en_proceso) — solo subió certificado
INSERT INTO documentos (id, tramite_id, tipo_documento_id, archivo_nombre, archivo_tamaño, estatus, fecha_subida) VALUES
(15, 3, 1, 'certificado_20210003.pdf',    1100000, 'cargado',    '2026-06-01 11:00:00'),
(16, 3, 2, 'ingles_20210003.pdf',           800000, 'pendiente',  NULL),
(17, 3, 3, 'foto_20210003.jpg',             510000, 'pendiente',  NULL),
(18, 3, 4, 'pago_20210003.pdf',             390000, 'pendiente',  NULL),
(19, 3, 30,'promedio_20210003.pdf',         250000, 'pendiente',  NULL),
(20, 3, 31,'no_adeudo_20210003.pdf',        200000, 'pendiente',  NULL);

-- Trámite 4 (2021-0004, Tesis, aprobado) — todos aprobados (P-19)
INSERT INTO documentos (id, tramite_id, tipo_documento_id, archivo_nombre, archivo_tamaño, estatus, fecha_subida, revisado_por, fecha_revision) VALUES
(21, 4, 1,  'certificado_20210004.pdf',     1800000, 'aprobado', '2026-04-01 08:30:00', 20, '2026-04-02 10:00:00'),
(22, 4, 2,  'ingles_20210004.pdf',            750000, 'aprobado', '2026-04-01 08:35:00', 20, '2026-04-02 10:05:00'),
(23, 4, 3,  'foto_20210004.jpg',              490000, 'aprobado', '2026-04-01 08:40:00', 20, '2026-04-02 10:10:00'),
(24, 4, 4,  'pago_20210004.pdf',              380000, 'aprobado', '2026-04-01 08:45:00', 20, '2026-04-02 10:15:00'),
(25, 4, 10, 'tesis_20210004.pdf',           4500000, 'aprobado', '2026-04-05 12:00:00', 21, '2026-04-06 09:30:00'),
(26, 4, 11, 'carta_asesor_20210004.pdf',      220000, 'aprobado', '2026-04-05 12:05:00', 21, '2026-04-06 09:35:00'),
(27, 4, 5,  'solicitud_20210004.pdf',         310000, 'aprobado', '2026-04-10 10:00:00', 20, '2026-04-11 08:45:00');

-- Trámite 5 (2021-0005, Tesis, rechazado) — fotografía rechazada (P-20)
INSERT INTO documentos (id, tramite_id, tipo_documento_id, archivo_nombre, archivo_tamaño, estatus, fecha_subida, revisado_por, fecha_revision, motivo_rechazo) VALUES
(28, 5, 1,  'certificado_20210005.pdf',     1400000, 'aprobado',    '2026-05-01 09:00:00', 20, '2026-05-02 08:30:00', NULL),
(29, 5, 2,  'ingles_20210005.pdf',            820000, 'aprobado',    '2026-05-01 09:05:00', 20, '2026-05-02 08:35:00', NULL),
(30, 5, 3,  'foto_20210005.jpg',              510000, 'rechazado',   '2026-05-01 09:10:00', 20, '2026-05-02 09:00:00',
 'Fotografía no cumple con especificación de fondo mate. Presenta brillos y sombras visibles.'),
(31, 5, 4,  'pago_20210005.pdf',              360000, 'cargado',     '2026-05-03 10:00:00', NULL, NULL, NULL),
(32, 5, 10, 'tesis_20210005.pdf',           3200000, 'cargado',     '2026-05-05 15:00:00', NULL, NULL, NULL),
(33, 5, 11, 'carta_asesor_20210005.pdf',      215000, 'pendiente',   NULL, NULL, NULL, NULL),
(34, 5, 5,  'solicitud_20210005.pdf',         295000, 'pendiente',   NULL, NULL, NULL, NULL);


-- =============================================================================
-- 5. ASIGNACIONES (Docentes a trámites)
-- =============================================================================

-- Trámite 1: asesor + 3 sinodales (P-27)
INSERT INTO asignaciones (tramite_id, usuario_id, rol_asignacion) VALUES
(1, 10, 'asesor'),   -- Mtra. Niza Alpízar
(1, 11, 'sinodal'),  -- Dr. García
(1, 12, 'sinodal'),  -- Ing. Laura Ramírez
(1, 13, 'sinodal');  -- Mtro. Carlos Mendoza

-- Trámite 4: asesor + 3 sinodales
INSERT INTO asignaciones (tramite_id, usuario_id, rol_asignacion) VALUES
(4, 10, 'asesor'),   -- Mtra. Niza Alpízar
(4, 14, 'sinodal'),  -- Dra. Patricia Díaz
(4, 15, 'sinodal'),  -- Mtro. Roberto Sánchez
(4, 12, 'sinodal');  -- Ing. Laura Ramírez

-- Trámite 5: asesor asignado (Dr. García — simular carga alta P-26)
INSERT INTO asignaciones (tramite_id, usuario_id, rol_asignacion) VALUES
(5, 11, 'asesor');


-- =============================================================================
-- 6. DICTÁMENES
-- =============================================================================

-- Trámite 4: aprobado (P-19)
INSERT INTO dictamenes (tramite_id, resultado, observaciones, emitido_por) VALUES
(4, 'aprobado',
 'Todos los documentos cumplen con las normativas institucionales. El alumno puede continuar con el trámite presencial.',
 20);

-- Trámite 5: rechazado (P-20) — nota: el dictamen se emite una vez corregidos los rechazos
-- (No se emite dictamen mientras haya documentos rechazados)


-- =============================================================================
-- 7. HISTORIAL DE ESTADOS (Línea de tiempo — P-21)
-- =============================================================================

INSERT INTO historial_estados (tramite_id, documento_id, estado_anterior, estado_nuevo, comentario, usuario_id) VALUES
-- Trámite 4: trazabilidad completa
(4, NULL, NULL,           'en_proceso',  'Trámite iniciado por el alumno.',                         4),
(4, 21,  NULL,            'cargado',     'Certificado de estudios subido.',                          4),
(4, 21,  'cargado',       'aprobado',    'Documento válido. Sin observaciones.',                     20),
(4, 22,  NULL,            'cargado',     'Constancia de inglés subida.',                             4),
(4, 22,  'cargado',       'aprobado',    'Nivel B2 acreditado. Documento válido.',                   20),
(4, 27,  'cargado',       'aprobado',    'Solicitud de titulación verificada.',                      20),
(4, NULL,'en_proceso',    'aprobado',    'Todos los documentos aprobados. Se emite dictamen.',       20),

-- Trámite 5: fotografía rechazada (P-20)
(5, NULL, NULL,           'en_proceso',  'Trámite iniciado.',                                        5),
(5, 30,  NULL,            'cargado',     'Fotografía subida por el alumno.',                         5),
(5, 30,  'cargado',       'rechazado',   'Fondo no mate, presenta brillos. Debe repetir fotografía.',20),
(5, NULL,'en_proceso',    'rechazado',   'Trámite marcado como rechazado por documento inválido.',   20);


-- =============================================================================
-- 8. NOTIFICACIONES (P-23, P-24)
-- =============================================================================

INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, leida, tramite_id) VALUES
-- Para 2021-0001 (trámite en revisión)
(1, 'ambos', 'Documento Aprobado',
 'Tu Certificado de Estudios ha sido aprobado por Control Escolar.',
 1, 1),
(1, 'in_app', 'Documento en Revisión',
 'Tu fotografía tamaño miñón está siendo revisada por el comité.',
 0, 1),
(1, 'email', 'Asignación de Asesor',
 'La Mtra. Niza Lucero Alpízar Martínez ha sido asignada como tu asesora de tesis.',
 1, 1),

-- Para 2021-0004 (trámite aprobado — P-19, P-23)
(4, 'ambos', 'Trámite Aprobado',
 'Todos tus documentos han sido aprobados. Acude a ventanilla en horario 08:00–14:00 hrs para continuar con la entrega física.',
 1, 4),

-- Para 2021-0005 (fotografía rechazada — P-20)
(5, 'ambos', 'Documento Rechazado',
 'Tu fotografía ha sido rechazada. Motivo: Fondo no mate, presenta brillos. Debes subir una nueva fotografía.',
 0, 5),

-- Para docentes (P-25, P-27)
(10, 'in_app', 'Nueva Asignación como Asesor',
 'Has sido asignado como asesor del alumno 2021-0001 para la opción Tesis.',
 0, 1),
(11, 'in_app', 'Nueva Asignación como Sinodal',
 'Has sido designado como sinodal para el examen profesional del alumno 2021-0001.',
 0, 1);


-- =============================================================================
-- 9. BITÁCORA (P-09)
-- =============================================================================

INSERT INTO bitacora (usuario_id, accion, entidad, entidad_id, ip_origen, detalle) VALUES
(20, 'Aprobación de documento',         'documentos', 21, '192.168.1.100',
 '{"tipo":"Certificado de Estudios","alumno":"2021-0004"}'),
(20, 'Aprobación de documento',         'documentos', 22, '192.168.1.100',
 '{"tipo":"Constancia de Inglés","alumno":"2021-0004"}'),
(20, 'Rechazo de documento',            'documentos', 30, '192.168.1.100',
 '{"tipo":"Fotografía","alumno":"2021-0005","motivo":"Fondo no mate"}'),
(20, 'Aprobación de expediente',        'tramites',   4,  '192.168.1.100',
 '{"alumno":"2021-0004","opcion":"Tesis"}'),
(20, 'Emisión de dictamen',             'dictamenes', 1,  '192.168.1.100',
 '{"resultado":"aprobado","alumno":"2021-0004"}'),
(21, 'Inicio de sesión',                'usuarios',   21, '192.168.1.101',
 '{"navegador":"Chrome 125","so":"Windows 11"}'),
(1,  'Subida de documento',             'documentos', 1,  '187.190.56.25',
 '{"tipo":"Certificado de Estudios","tamaño_mb":1.5}'),
(1,  'Subida de documento',             'documentos', 5,  '187.190.56.25',
 '{"tipo":"Documento de Tesis","tamaño_mb":3.0}');

-- =============================================================================
-- FIN DEL SEED
-- =============================================================================
