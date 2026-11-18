<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Demo tramites with their documentos, asignaciones and dictamen.
 * Mirrors the legacy database/seed.sql (same ids and values).
 */
class TramiteSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('tramites')->insertOrIgnore([
            ['id' => 1, 'usuario_id' => 1, 'opcion_titulacion_id' => 1, 'estatus' => 'en_revision', 'titulo_proyecto' => 'Sistema Web de Control y Administración de Titulación para TESCHA ISC'],
            ['id' => 2, 'usuario_id' => 2, 'opcion_titulacion_id' => 2, 'estatus' => 'en_proceso', 'titulo_proyecto' => 'Desarrollo de Aplicación Móvil para Trazabilidad de Entregas en Empresa Logística'],
            ['id' => 3, 'usuario_id' => 3, 'opcion_titulacion_id' => 3, 'estatus' => 'en_proceso', 'titulo_proyecto' => null],
            ['id' => 4, 'usuario_id' => 4, 'opcion_titulacion_id' => 1, 'estatus' => 'aprobado', 'titulo_proyecto' => 'Análisis de Seguridad en Redes IoT para el Sector Industrial'],
            ['id' => 5, 'usuario_id' => 5, 'opcion_titulacion_id' => 1, 'estatus' => 'rechazado', 'titulo_proyecto' => 'Implementación de Algoritmos de Machine Learning para Predicción de Deserción'],
        ]);

        DB::table('documentos')->insertOrIgnore([
            ['id' => 1, 'tramite_id' => 1, 'tipo_documento_id' => '1', 'archivo_nombre' => 'certificado_20210001.pdf', 'archivo_tamaño' => 1572864, 'estatus' => 'aprobado', 'fecha_subida' => '2026-05-10 10:30:00', 'revisado_por' => 20, 'fecha_revision' => '2026-05-11 09:15:00', 'motivo_rechazo' => null],
            ['id' => 2, 'tramite_id' => 1, 'tipo_documento_id' => '2', 'archivo_nombre' => 'ingles_20210001.pdf', 'archivo_tamaño' => 838860, 'estatus' => 'aprobado', 'fecha_subida' => '2026-05-10 10:35:00', 'revisado_por' => 20, 'fecha_revision' => '2026-05-11 09:20:00', 'motivo_rechazo' => null],
            ['id' => 3, 'tramite_id' => 1, 'tipo_documento_id' => '3', 'archivo_nombre' => 'foto_20210001.jpg', 'archivo_tamaño' => 524288, 'estatus' => 'en_revision', 'fecha_subida' => '2026-05-10 10:40:00', 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 4, 'tramite_id' => 1, 'tipo_documento_id' => '4', 'archivo_nombre' => 'pago_20210001.pdf', 'archivo_tamaño' => 419430, 'estatus' => 'cargado', 'fecha_subida' => '2026-05-12 08:00:00', 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 5, 'tramite_id' => 1, 'tipo_documento_id' => '10', 'archivo_nombre' => 'tesis_20210001.pdf', 'archivo_tamaño' => 3145728, 'estatus' => 'cargado', 'fecha_subida' => '2026-05-15 14:20:00', 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 6, 'tramite_id' => 1, 'tipo_documento_id' => '11', 'archivo_nombre' => 'carta_asesor_20210001.pdf', 'archivo_tamaño' => 209715, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 7, 'tramite_id' => 1, 'tipo_documento_id' => '5', 'archivo_nombre' => 'solicitud_20210001.pdf', 'archivo_tamaño' => 307200, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 8, 'tramite_id' => 2, 'tipo_documento_id' => '1', 'archivo_nombre' => 'certificado_20210002.pdf', 'archivo_tamaño' => 1200000, 'estatus' => 'cargado', 'fecha_subida' => '2026-05-20 09:00:00', 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 9, 'tramite_id' => 2, 'tipo_documento_id' => '2', 'archivo_nombre' => 'ingles_20210002.pdf', 'archivo_tamaño' => 950000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 10, 'tramite_id' => 2, 'tipo_documento_id' => '3', 'archivo_nombre' => 'foto_20210002.jpg', 'archivo_tamaño' => 480000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 11, 'tramite_id' => 2, 'tipo_documento_id' => '4', 'archivo_nombre' => 'pago_20210002.pdf', 'archivo_tamaño' => 350000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 12, 'tramite_id' => 2, 'tipo_documento_id' => '20', 'archivo_nombre' => 'memoria_residencias_20210002.pdf', 'archivo_tamaño' => 2500000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 13, 'tramite_id' => 2, 'tipo_documento_id' => '21', 'archivo_nombre' => 'carta_empresa_20210002.pdf', 'archivo_tamaño' => 307200, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 14, 'tramite_id' => 2, 'tipo_documento_id' => '5', 'archivo_nombre' => 'solicitud_20210002.pdf', 'archivo_tamaño' => 280000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 15, 'tramite_id' => 3, 'tipo_documento_id' => '1', 'archivo_nombre' => 'certificado_20210003.pdf', 'archivo_tamaño' => 1100000, 'estatus' => 'cargado', 'fecha_subida' => '2026-06-01 11:00:00', 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 16, 'tramite_id' => 3, 'tipo_documento_id' => '2', 'archivo_nombre' => 'ingles_20210003.pdf', 'archivo_tamaño' => 800000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 17, 'tramite_id' => 3, 'tipo_documento_id' => '3', 'archivo_nombre' => 'foto_20210003.jpg', 'archivo_tamaño' => 510000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 18, 'tramite_id' => 3, 'tipo_documento_id' => '4', 'archivo_nombre' => 'pago_20210003.pdf', 'archivo_tamaño' => 390000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 19, 'tramite_id' => 3, 'tipo_documento_id' => '30', 'archivo_nombre' => 'promedio_20210003.pdf', 'archivo_tamaño' => 250000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 20, 'tramite_id' => 3, 'tipo_documento_id' => '31', 'archivo_nombre' => 'no_adeudo_20210003.pdf', 'archivo_tamaño' => 200000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 21, 'tramite_id' => 4, 'tipo_documento_id' => '1', 'archivo_nombre' => 'certificado_20210004.pdf', 'archivo_tamaño' => 1800000, 'estatus' => 'aprobado', 'fecha_subida' => '2026-04-01 08:30:00', 'revisado_por' => 20, 'fecha_revision' => '2026-04-02 10:00:00', 'motivo_rechazo' => null],
            ['id' => 22, 'tramite_id' => 4, 'tipo_documento_id' => '2', 'archivo_nombre' => 'ingles_20210004.pdf', 'archivo_tamaño' => 750000, 'estatus' => 'aprobado', 'fecha_subida' => '2026-04-01 08:35:00', 'revisado_por' => 20, 'fecha_revision' => '2026-04-02 10:05:00', 'motivo_rechazo' => null],
            ['id' => 23, 'tramite_id' => 4, 'tipo_documento_id' => '3', 'archivo_nombre' => 'foto_20210004.jpg', 'archivo_tamaño' => 490000, 'estatus' => 'aprobado', 'fecha_subida' => '2026-04-01 08:40:00', 'revisado_por' => 20, 'fecha_revision' => '2026-04-02 10:10:00', 'motivo_rechazo' => null],
            ['id' => 24, 'tramite_id' => 4, 'tipo_documento_id' => '4', 'archivo_nombre' => 'pago_20210004.pdf', 'archivo_tamaño' => 380000, 'estatus' => 'aprobado', 'fecha_subida' => '2026-04-01 08:45:00', 'revisado_por' => 20, 'fecha_revision' => '2026-04-02 10:15:00', 'motivo_rechazo' => null],
            ['id' => 25, 'tramite_id' => 4, 'tipo_documento_id' => '10', 'archivo_nombre' => 'tesis_20210004.pdf', 'archivo_tamaño' => 4500000, 'estatus' => 'aprobado', 'fecha_subida' => '2026-04-05 12:00:00', 'revisado_por' => 21, 'fecha_revision' => '2026-04-06 09:30:00', 'motivo_rechazo' => null],
            ['id' => 26, 'tramite_id' => 4, 'tipo_documento_id' => '11', 'archivo_nombre' => 'carta_asesor_20210004.pdf', 'archivo_tamaño' => 220000, 'estatus' => 'aprobado', 'fecha_subida' => '2026-04-05 12:05:00', 'revisado_por' => 21, 'fecha_revision' => '2026-04-06 09:35:00', 'motivo_rechazo' => null],
            ['id' => 27, 'tramite_id' => 4, 'tipo_documento_id' => '5', 'archivo_nombre' => 'solicitud_20210004.pdf', 'archivo_tamaño' => 310000, 'estatus' => 'aprobado', 'fecha_subida' => '2026-04-10 10:00:00', 'revisado_por' => 20, 'fecha_revision' => '2026-04-11 08:45:00', 'motivo_rechazo' => null],
            ['id' => 28, 'tramite_id' => 5, 'tipo_documento_id' => '1', 'archivo_nombre' => 'certificado_20210005.pdf', 'archivo_tamaño' => 1400000, 'estatus' => 'aprobado', 'fecha_subida' => '2026-05-01 09:00:00', 'revisado_por' => 20, 'fecha_revision' => '2026-05-02 08:30:00', 'motivo_rechazo' => null],
            ['id' => 29, 'tramite_id' => 5, 'tipo_documento_id' => '2', 'archivo_nombre' => 'ingles_20210005.pdf', 'archivo_tamaño' => 820000, 'estatus' => 'aprobado', 'fecha_subida' => '2026-05-01 09:05:00', 'revisado_por' => 20, 'fecha_revision' => '2026-05-02 08:35:00', 'motivo_rechazo' => null],
            ['id' => 30, 'tramite_id' => 5, 'tipo_documento_id' => '3', 'archivo_nombre' => 'foto_20210005.jpg', 'archivo_tamaño' => 510000, 'estatus' => 'rechazado', 'fecha_subida' => '2026-05-01 09:10:00', 'revisado_por' => 20, 'fecha_revision' => '2026-05-02 09:00:00', 'motivo_rechazo' => 'Fotografía no cumple con especificación de fondo mate. Presenta brillos y sombras visibles.'],
            ['id' => 31, 'tramite_id' => 5, 'tipo_documento_id' => '4', 'archivo_nombre' => 'pago_20210005.pdf', 'archivo_tamaño' => 360000, 'estatus' => 'cargado', 'fecha_subida' => '2026-05-03 10:00:00', 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 32, 'tramite_id' => 5, 'tipo_documento_id' => '10', 'archivo_nombre' => 'tesis_20210005.pdf', 'archivo_tamaño' => 3200000, 'estatus' => 'cargado', 'fecha_subida' => '2026-05-05 15:00:00', 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 33, 'tramite_id' => 5, 'tipo_documento_id' => '11', 'archivo_nombre' => 'carta_asesor_20210005.pdf', 'archivo_tamaño' => 215000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
            ['id' => 34, 'tramite_id' => 5, 'tipo_documento_id' => '5', 'archivo_nombre' => 'solicitud_20210005.pdf', 'archivo_tamaño' => 295000, 'estatus' => 'pendiente', 'fecha_subida' => null, 'revisado_por' => null, 'fecha_revision' => null, 'motivo_rechazo' => null],
        ]);

        DB::table('asignaciones')->insertOrIgnore([
            ['id' => 1, 'tramite_id' => 1, 'usuario_id' => 10, 'rol_asignacion' => 'asesor'],
            ['id' => 2, 'tramite_id' => 1, 'usuario_id' => 11, 'rol_asignacion' => 'sinodal'],
            ['id' => 3, 'tramite_id' => 1, 'usuario_id' => 12, 'rol_asignacion' => 'sinodal'],
            ['id' => 4, 'tramite_id' => 1, 'usuario_id' => 13, 'rol_asignacion' => 'sinodal'],
            ['id' => 5, 'tramite_id' => 4, 'usuario_id' => 10, 'rol_asignacion' => 'asesor'],
            ['id' => 6, 'tramite_id' => 4, 'usuario_id' => 14, 'rol_asignacion' => 'sinodal'],
            ['id' => 7, 'tramite_id' => 4, 'usuario_id' => 15, 'rol_asignacion' => 'sinodal'],
            ['id' => 8, 'tramite_id' => 4, 'usuario_id' => 12, 'rol_asignacion' => 'sinodal'],
            ['id' => 9, 'tramite_id' => 5, 'usuario_id' => 11, 'rol_asignacion' => 'asesor'],
        ]);

        DB::table('dictamenes')->insertOrIgnore([
            ['id' => 1, 'tramite_id' => 4, 'resultado' => 'aprobado', 'observaciones' => 'Todos los documentos cumplen con las normativas institucionales. El alumno puede continuar con el trámite presencial.', 'emitido_por' => 20],
        ]);
    }
}
