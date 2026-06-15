import { query } from "../../config/database";
import type { Tramite, TramiteConDocumentos } from "../../domain/entities/Tramite";
import type { DocumentoInfo, HistorialEntry } from "../../domain/entities/Documento";

export class MysqlTramiteRepository {
  async findById(id: number): Promise<Tramite | null> {
    const rows = await query<Tramite[]>(
      "SELECT * FROM tramites WHERE id = ? AND activo = 1",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByUsuarioId(usuario_id: number): Promise<Tramite | null> {
    const rows = await query<Tramite[]>(
      `SELECT t.* FROM tramites t WHERE t.usuario_id = ? AND t.activo = 1 ORDER BY t.fecha_inicio DESC LIMIT 1`,
      [usuario_id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getTramiteConDocumentos(usuario_id: number): Promise<TramiteConDocumentos | null> {
    const tramite = await this.findByUsuarioId(usuario_id);
    if (!tramite) return null;

    // Obtener opción de titulación
    const opciones = await query<{ nombre: string }[]>(
      "SELECT nombre FROM opciones_titulacion WHERE id = ?",
      [tramite.opcion_titulacion_id]
    );

    // Obtener documentos con su tipo, incluyendo bloqueos por prerrequisito
    const documentos = await query<DocumentoInfo[]>(
      `SELECT
        td.id AS tipo_documento_id,
        td.nombre AS tipo_documento_nombre,
        td.obligatorio AS tipo_documento_obligatorio,
        td.prerrequisito_id,
        pr.nombre AS prerrequisito_nombre,
        td.formato_permitido,
        td.tamaño_max_mb,
        td.orden,
        d.id,
        d.tramite_id,
        d.archivo_url,
        d.archivo_nombre,
        d.archivo_tamaño,
        COALESCE(d.estatus, 'pendiente') AS estatus,
        d.fecha_subida,
        d.revisado_por,
        d.fecha_revision,
        d.motivo_rechazo
      FROM tipos_documento td
      LEFT JOIN tipos_documento pr ON td.prerrequisito_id = pr.id
      LEFT JOIN documentos d ON d.tipo_documento_id = td.id AND d.tramite_id = ?
      WHERE (td.opcion_titulacion_id IS NULL OR td.opcion_titulacion_id = ?)
        AND td.activo = 1
      ORDER BY td.orden`,
      [tramite.id, tramite.opcion_titulacion_id]
    );

    // Calcular bloqueos por prerrequisito (P-17)
    const documentosConBloqueo = documentos.map((doc) => {
      let bloqueado = false;
      let motivo_bloqueo: string | null = null;

      if (doc.prerrequisito_id) {
        const prereq = documentos.find((d) => d.tipo_documento_id === doc.prerrequisito_id);
        if (prereq && prereq.estatus !== "aprobado") {
          bloqueado = true;
          motivo_bloqueo = `El documento "${prereq.tipo_documento_nombre}" es prerrequisito. Cárguelo y espere su aprobación primero.`;
        }
      }

      return { ...doc, bloqueado, motivo_bloqueo };
    });

    // Calcular progreso
    const obligatorios = documentosConBloqueo.filter((d) => d.tipo_documento_obligatorio === 1);
    const total = obligatorios.length;
    const aprobados = obligatorios.filter((d) => d.estatus === "aprobado").length;
    const rechazados = obligatorios.filter((d) => d.estatus === "rechazado").length;
    const cargados = obligatorios.filter((d) => d.estatus === "cargado").length;
    const enRevision = obligatorios.filter((d) => d.estatus === "en_revision").length;
    const pendientes = obligatorios.filter((d) => d.estatus === "pendiente").length;

    const colorSemaforo =
      rechazados > 0 ? "rojo" as const
      : aprobados === total ? "verde" as const
      : "ambar" as const;

    const porcentaje = total > 0 ? Math.round((aprobados / total) * 100) : 0;

    // Obtener asignaciones (asesor y sinodales)
    const asignaciones = await query<import("../../domain/entities/Tramite").Asignacion[]>(
      `SELECT a.rol_asignacion, u.nombre, u.apellido_paterno, u.grado_academico, u.email
       FROM asignaciones a
       JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.tramite_id = ? AND a.activo = 1
       ORDER BY FIELD(a.rol_asignacion, 'asesor', 'sinodal', 'revisor')`,
      [tramite.id]
    );

    // Obtener dictamen si existe
    const dictamen = await query<import("../../domain/entities/Tramite").DictamenInfo[]>(
      `SELECT d.id, d.resultado, d.observaciones, d.fecha_emision,
              CONCAT(u.nombre, ' ', u.apellido_paterno) AS emitido_por
       FROM dictamenes d
       JOIN usuarios u ON d.emitido_por = u.id
       WHERE d.tramite_id = ?`,
      [tramite.id]
    );

    return {
      ...tramite,
      opcion_titulacion: opciones.length > 0 ? opciones[0].nombre : "Desconocida",
      documentos: documentosConBloqueo,
      asignaciones,
      dictamen: dictamen.length > 0 ? dictamen[0] : null,
      progreso: {
        total,
        aprobados,
        rechazados,
        cargados,
        en_revision: enRevision,
        pendientes,
        color_semaforo: colorSemaforo,
        porcentaje,
      },
    };
  }

  async getHistorial(tramite_id: number): Promise<HistorialEntry[]> {
    return query<HistorialEntry[]>(
      `SELECT
        h.id, h.tramite_id, h.documento_id,
        h.estado_anterior, h.estado_nuevo,
        h.comentario, h.usuario_id, h.fecha,
        CONCAT(u.nombre, ' ', u.apellido_paterno) AS usuario_nombre
      FROM historial_estados h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      WHERE h.tramite_id = ?
      ORDER BY h.fecha DESC`,
      [tramite_id]
    );
  }
}

export class MysqlDocumentoRepository {
  async findById(id: number): Promise<DocumentoInfo | null> {
    const rows = await query<DocumentoInfo[]>(
      `SELECT d.*, td.nombre AS tipo_documento_nombre, td.prerrequisito_id
       FROM documentos d
       JOIN tipos_documento td ON d.tipo_documento_id = td.id
       WHERE d.id = ?`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async uploadDocumento(
    tramite_id: number,
    tipo_documento_id: number,
    archivo_url: string,
    archivo_nombre: string,
    archivo_tamaño: number
  ): Promise<number> {
    const result = await query<{ insertId: number }>(
      `INSERT INTO documentos (tramite_id, tipo_documento_id, archivo_url, archivo_nombre, archivo_tamaño, estatus, fecha_subida)
       VALUES (?, ?, ?, ?, ?, 'cargado', NOW())
       ON DUPLICATE KEY UPDATE
         archivo_url = VALUES(archivo_url),
         archivo_nombre = VALUES(archivo_nombre),
         archivo_tamaño = VALUES(archivo_tamaño),
         estatus = 'cargado',
         fecha_subida = NOW(),
         motivo_rechazo = NULL`,
      [tramite_id, tipo_documento_id, archivo_url, archivo_nombre, archivo_tamaño]
    );
    return result.insertId;
  }

  async addHistorial(
    tramite_id: number,
    documento_id: number | null,
    estado_anterior: string | null,
    estado_nuevo: string,
    comentario: string | null,
    usuario_id: number
  ): Promise<void> {
    await query(
      `INSERT INTO historial_estados (tramite_id, documento_id, estado_anterior, estado_nuevo, comentario, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tramite_id, documento_id, estado_anterior, estado_nuevo, comentario, usuario_id]
    );
  }

  async verificarPrerrequisito(
    tramite_id: number,
    tipo_documento_id: number
  ): Promise<{ bloqueado: boolean; mensaje: string | null }> {
    const prereqs = await query<{ prerrequisito_id: number; nombre: string }[]>(
      `SELECT td.prerrequisito_id, pt.nombre
       FROM tipos_documento td
       JOIN tipos_documento pt ON td.prerrequisito_id = pt.id
       WHERE td.id = ?`,
      [tipo_documento_id]
    );

    if (prereqs.length === 0) {
      return { bloqueado: false, mensaje: null };
    }

    const prereqId = prereqs[0].prerrequisito_id;
    const prereqDocs = await query<{ estatus: string }[]>(
      `SELECT d.estatus FROM documentos d WHERE d.tramite_id = ? AND d.tipo_documento_id = ?`,
      [tramite_id, prereqId]
    );

    if (prereqDocs.length === 0 || prereqDocs[0].estatus !== "aprobado") {
      return {
        bloqueado: true,
        mensaje: `El documento "${prereqs[0].nombre}" es prerrequisito. Cárguelo y espere su aprobación primero.`,
      };
    }

    return { bloqueado: false, mensaje: null };
  }
}

export const tramiteRepository = new MysqlTramiteRepository();
export const documentoRepository = new MysqlDocumentoRepository();
