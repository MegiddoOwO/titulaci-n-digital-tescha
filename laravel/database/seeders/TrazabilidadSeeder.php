<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Demo historial de estados, notificaciones and bitacora.
 * Mirrors the legacy database/seed.sql (same ids and values).
 */
class TrazabilidadSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('historial_estados')->insertOrIgnore([
            ['id' => 1, 'tramite_id' => 4, 'documento_id' => null, 'estado_anterior' => null, 'estado_nuevo' => 'en_proceso', 'comentario' => 'Trámite iniciado por el alumno.', 'usuario_id' => 4],
            ['id' => 2, 'tramite_id' => 4, 'documento_id' => 21, 'estado_anterior' => null, 'estado_nuevo' => 'cargado', 'comentario' => 'Certificado de estudios subido.', 'usuario_id' => 4],
            ['id' => 3, 'tramite_id' => 4, 'documento_id' => 21, 'estado_anterior' => 'cargado', 'estado_nuevo' => 'aprobado', 'comentario' => 'Documento válido. Sin observaciones.', 'usuario_id' => 20],
            ['id' => 4, 'tramite_id' => 4, 'documento_id' => 22, 'estado_anterior' => null, 'estado_nuevo' => 'cargado', 'comentario' => 'Constancia de inglés subida.', 'usuario_id' => 4],
            ['id' => 5, 'tramite_id' => 4, 'documento_id' => 22, 'estado_anterior' => 'cargado', 'estado_nuevo' => 'aprobado', 'comentario' => 'Nivel B2 acreditado. Documento válido.', 'usuario_id' => 20],
            ['id' => 6, 'tramite_id' => 4, 'documento_id' => 27, 'estado_anterior' => 'cargado', 'estado_nuevo' => 'aprobado', 'comentario' => 'Solicitud de titulación verificada.', 'usuario_id' => 20],
            ['id' => 7, 'tramite_id' => 4, 'documento_id' => null, 'estado_anterior' => 'en_proceso', 'estado_nuevo' => 'aprobado', 'comentario' => 'Todos los documentos aprobados. Se emite dictamen.', 'usuario_id' => 20],
            ['id' => 8, 'tramite_id' => 5, 'documento_id' => null, 'estado_anterior' => null, 'estado_nuevo' => 'en_proceso', 'comentario' => 'Trámite iniciado.', 'usuario_id' => 5],
            ['id' => 9, 'tramite_id' => 5, 'documento_id' => 30, 'estado_anterior' => null, 'estado_nuevo' => 'cargado', 'comentario' => 'Fotografía subida por el alumno.', 'usuario_id' => 5],
            ['id' => 10, 'tramite_id' => 5, 'documento_id' => 30, 'estado_anterior' => 'cargado', 'estado_nuevo' => 'rechazado', 'comentario' => 'Fondo no mate, presenta brillos. Debe repetir fotografía.', 'usuario_id' => 20],
            ['id' => 11, 'tramite_id' => 5, 'documento_id' => null, 'estado_anterior' => 'en_proceso', 'estado_nuevo' => 'rechazado', 'comentario' => 'Trámite marcado como rechazado por documento inválido.', 'usuario_id' => 20],
        ]);

        DB::table('notificaciones')->insertOrIgnore([
            ['id' => 1, 'usuario_id' => 1, 'tipo' => 'ambos', 'titulo' => 'Documento Aprobado', 'mensaje' => 'Tu Certificado de Estudios ha sido aprobado por Control Escolar.', 'leida' => 1, 'tramite_id' => 1],
            ['id' => 2, 'usuario_id' => 1, 'tipo' => 'in_app', 'titulo' => 'Documento en Revisión', 'mensaje' => 'Tu fotografía tamaño miñón está siendo revisada por el comité.', 'leida' => 0, 'tramite_id' => 1],
            ['id' => 3, 'usuario_id' => 1, 'tipo' => 'email', 'titulo' => 'Asignación de Asesor', 'mensaje' => 'La Mtra. Niza Lucero Alpízar Martínez ha sido asignada como tu asesora de tesis.', 'leida' => 1, 'tramite_id' => 1],
            ['id' => 4, 'usuario_id' => 4, 'tipo' => 'ambos', 'titulo' => 'Trámite Aprobado', 'mensaje' => 'Todos tus documentos han sido aprobados. Acude a ventanilla en horario 08:00–14:00 hrs para continuar con la entrega física.', 'leida' => 1, 'tramite_id' => 4],
            ['id' => 5, 'usuario_id' => 5, 'tipo' => 'ambos', 'titulo' => 'Documento Rechazado', 'mensaje' => 'Tu fotografía ha sido rechazada. Motivo: Fondo no mate, presenta brillos. Debes subir una nueva fotografía.', 'leida' => 0, 'tramite_id' => 5],
            ['id' => 6, 'usuario_id' => 10, 'tipo' => 'in_app', 'titulo' => 'Nueva Asignación como Asesor', 'mensaje' => 'Has sido asignado como asesor del alumno 2021-0001 para la opción Tesis.', 'leida' => 0, 'tramite_id' => 1],
            ['id' => 7, 'usuario_id' => 11, 'tipo' => 'in_app', 'titulo' => 'Nueva Asignación como Sinodal', 'mensaje' => 'Has sido designado como sinodal para el examen profesional del alumno 2021-0001.', 'leida' => 0, 'tramite_id' => 1],
        ]);

        DB::table('bitacora')->insertOrIgnore([
            ['id' => 1, 'usuario_id' => 20, 'accion' => 'Aprobación de documento', 'entidad' => 'documentos', 'entidad_id' => 21, 'ip_origen' => '192.168.1.100', 'detalle' => '{"tipo":"Certificado de Estudios","alumno":"2021-0004"}'],
            ['id' => 2, 'usuario_id' => 20, 'accion' => 'Aprobación de documento', 'entidad' => 'documentos', 'entidad_id' => 22, 'ip_origen' => '192.168.1.100', 'detalle' => '{"tipo":"Constancia de Inglés","alumno":"2021-0004"}'],
            ['id' => 3, 'usuario_id' => 20, 'accion' => 'Rechazo de documento', 'entidad' => 'documentos', 'entidad_id' => 30, 'ip_origen' => '192.168.1.100', 'detalle' => '{"tipo":"Fotografía","alumno":"2021-0005","motivo":"Fondo no mate"}'],
            ['id' => 4, 'usuario_id' => 20, 'accion' => 'Aprobación de expediente', 'entidad' => 'tramites', 'entidad_id' => 4, 'ip_origen' => '192.168.1.100', 'detalle' => '{"alumno":"2021-0004","opcion":"Tesis"}'],
            ['id' => 5, 'usuario_id' => 20, 'accion' => 'Emisión de dictamen', 'entidad' => 'dictamenes', 'entidad_id' => 1, 'ip_origen' => '192.168.1.100', 'detalle' => '{"resultado":"aprobado","alumno":"2021-0004"}'],
            ['id' => 6, 'usuario_id' => 21, 'accion' => 'Inicio de sesión', 'entidad' => 'usuarios', 'entidad_id' => 21, 'ip_origen' => '192.168.1.101', 'detalle' => '{"navegador":"Chrome 125","so":"Windows 11"}'],
            ['id' => 7, 'usuario_id' => 1, 'accion' => 'Subida de documento', 'entidad' => 'documentos', 'entidad_id' => 1, 'ip_origen' => '187.190.56.25', 'detalle' => '{"tipo":"Certificado de Estudios","tamaño_mb":1.5}'],
            ['id' => 8, 'usuario_id' => 1, 'accion' => 'Subida de documento', 'entidad' => 'documentos', 'entidad_id' => 5, 'ip_origen' => '187.190.56.25', 'detalle' => '{"tipo":"Documento de Tesis","tamaño_mb":3.0}'],
        ]);
    }
}
