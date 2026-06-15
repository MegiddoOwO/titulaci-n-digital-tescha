import { query, transaction } from "../../config/database";
import { notificacionService, bitacoraService } from "../services/NotificacionService";
import type { ExpedienteListItem, AdminDashboardStats } from "../../domain/entities/Admin";
import type { TramiteConDocumentos } from "../../domain/entities/Tramite";
import type { DocumentoInfo } from "../../domain/entities/Documento";

export class AdminRepository {
  async getStats(): Promise<AdminDashboardStats> {
    const [total] = await query<{ cnt: number }[]>(
      "SELECT COUNT(*) AS cnt FROM tramites WHERE activo = 1"
    );
    const [dictamenes] = await query<{ cnt: number }[]>(
      "SELECT COUNT(*) AS cnt FROM dictamenes"
    );
    const [pendientes] = await query<{ cnt: number }[]>(
      "SELECT COUNT(*) AS cnt FROM documentos WHERE estatus IN ('cargado','pendiente','en_revision')"
    );

    const porEstatus = await query<{ estatus: string; cnt: number }[]>(
      `SELECT estatus, COUNT(*) AS cnt FROM tramites WHERE activo = 1 GROUP BY estatus`
    );

    const stats: AdminDashboardStats = {
      total_activos: total?.cnt ?? 0,
      dictamenes_emitidos: dictamenes?.cnt ?? 0,
      pendientes_revision: pendientes?.cnt ?? 0,
      en_proceso: porEstatus.filter((e) => e.estatus === "en_proceso" || e.estatus === "en_revision").reduce((s, e) => s + e.cnt, 0),
      por_estatus: {
        en_proceso: porEstatus.find((e) => e.estatus === "en_proceso")?.cnt ?? 0,
        en_revision: porEstatus.find((e) => e.estatus === "en_revision")?.cnt ?? 0,
        aprobado: porEstatus.find((e) => e.estatus === "aprobado")?.cnt ?? 0,
        rechazado: porEstatus.find((e) => e.estatus === "rechazado")?.cnt ?? 0,
        completado: porEstatus.find((e) => e.estatus === "completado")?.cnt ?? 0,
      },
    };
    return stats;
  }

  async listarExpedientes(params: {
    search?: string;
    estatus?: string;
    page: number;
    limit: number;
  }): Promise<{ expedientes: ExpedienteListItem[]; total: number }> {
    const offset = (params.page - 1) * params.limit;
    const conditions: string[] = ["t.activo = 1", "u.rol = 'estudiante'"];
    const vals: unknown[] = [];

    if (params.search) {
      conditions.push("(u.numero_control LIKE ? OR CONCAT(u.nombre, ' ', u.apellido_paterno) LIKE ?)");
      vals.push(`%${params.search}%`, `%${params.search}%`);
    }
    if (params.estatus) {
      conditions.push("t.estatus = ?");
      vals.push(params.estatus);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM tramites t JOIN usuarios u ON t.usuario_id = u.id ${where}`,
      vals
    );
    const total = countResult[0]?.total ?? 0;

    const rows = await query<ExpedienteListItem[]>(
      `SELECT
        t.id, u.numero_control,
        CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_completo,
        o.nombre AS opcion_titulacion,
        t.estatus, t.titulo_proyecto, t.fecha_inicio, t.fecha_actualizacion,
        COALESCE(v.total_documentos, 0) AS total_docs,
        COALESCE(v.docs_aprobados, 0) AS docs_aprobados,
        COALESCE(v.docs_rechazados, 0) AS docs_rechazados,
        COALESCE(v.docs_cargados, 0) AS docs_cargados,
        COALESCE(v.docs_en_revision, 0) AS docs_en_revision,
        COALESCE(v.color_semaforo, 'ambar') AS color_semaforo,
        COALESCE(v.porcentaje_avance, 0) AS porcentaje
      FROM tramites t
      JOIN usuarios u ON t.usuario_id = u.id
      JOIN opciones_titulacion o ON t.opcion_titulacion_id = o.id
      LEFT JOIN vw_progreso_tramite v ON t.id = v.tramite_id
      ${where}
      ORDER BY t.fecha_actualizacion DESC
      LIMIT ? OFFSET ?`,
      [...vals, params.limit, offset]
    );

    return { expedientes: rows, total };
  }

  async getExpedienteDetalle(tramite_id: number): Promise<TramiteConDocumentos | null> {
    const tramite = await query<{ id: number; usuario_id: number; opcion_titulacion_id: number; estatus: string; fecha_inicio: string; fecha_actualizacion: string; fecha_fin: string | null; titulo_proyecto: string | null; activo: number }[]>(
      "SELECT * FROM tramites WHERE id = ? AND activo = 1", [tramite_id]
    );
    if (tramite.length === 0) return null;
    const t = tramite[0];

    const opciones = await query<{ nombre: string }[]>(
      "SELECT nombre FROM opciones_titulacion WHERE id = ?", [t.opcion_titulacion_id]
    );

    const documentos = await query<DocumentoInfo[]>(
      `SELECT
        td.id AS tipo_documento_id, td.nombre AS tipo_documento_nombre,
        td.obligatorio AS tipo_documento_obligatorio,
        td.prerrequisito_id, pr.nombre AS prerrequisito_nombre,
        td.formato_permitido, td.tamaño_max_mb, td.orden,
        d.id, d.tramite_id, d.archivo_url, d.archivo_nombre,
        d.archivo_tamaño,
        COALESCE(d.estatus, 'pendiente') AS estatus,
        d.fecha_subida, d.revisado_por, d.fecha_revision, d.motivo_rechazo
      FROM tipos_documento td
      LEFT JOIN tipos_documento pr ON td.prerrequisito_id = pr.id
      LEFT JOIN documentos d ON d.tipo_documento_id = td.id AND d.tramite_id = ?
      WHERE (td.opcion_titulacion_id IS NULL OR td.opcion_titulacion_id = ?) AND td.activo = 1
      ORDER BY td.orden`,
      [t.id, t.opcion_titulacion_id]
    );

    const docs = documentos.map((doc) => {
      let bloqueado = false;
      let motivo_bloqueo: string | null = null;
      if (doc.prerrequisito_id) {
        const prereq = documentos.find((d) => d.tipo_documento_id === doc.prerrequisito_id);
        if (prereq && prereq.estatus !== "aprobado") {
          bloqueado = true;
          motivo_bloqueo = `El documento "${prereq.tipo_documento_nombre}" es prerrequisito.`;
        }
      }
      return { ...doc, bloqueado, motivo_bloqueo };
    });

    const obligatorios = docs.filter((d) => d.tipo_documento_obligatorio === 1);
    const aprobados = obligatorios.filter((d) => d.estatus === "aprobado").length;
    const rechazados = obligatorios.filter((d) => d.estatus === "rechazado").length;
    const total = obligatorios.length;
    const color = rechazados > 0 ? "rojo" as const : aprobados === total ? "verde" as const : "ambar" as const;
    const porcentaje = total > 0 ? Math.round((aprobados / total) * 100) : 0;

    const asignaciones = await query<import("../../domain/entities/Tramite").Asignacion[]>(
      `SELECT a.id, a.rol_asignacion, u.nombre, u.apellido_paterno, u.grado_academico, u.email
       FROM asignaciones a
       JOIN usuarios u ON a.usuario_id = u.id
       WHERE a.tramite_id = ?
       ORDER BY FIELD(a.rol_asignacion, 'asesor', 'sinodal', 'revisor')`,
      [t.id]
    );

    const dictamenData = await query<import("../../domain/entities/Tramite").DictamenInfo[]>(
      `SELECT d.id, d.resultado, d.observaciones, d.fecha_emision,
              CONCAT(u.nombre, ' ', u.apellido_paterno) AS emitido_por
       FROM dictamenes d
       JOIN usuarios u ON d.emitido_por = u.id
       WHERE d.tramite_id = ?`,
      [t.id]
    );

    return {
      id: t.id, usuario_id: t.usuario_id,
      opcion_titulacion_id: t.opcion_titulacion_id,
      estatus: t.estatus as TramiteConDocumentos["estatus"],
      fecha_inicio: new Date(t.fecha_inicio),
      fecha_actualizacion: new Date(t.fecha_actualizacion),
      fecha_fin: t.fecha_fin ? new Date(t.fecha_fin) : null,
      titulo_proyecto: t.titulo_proyecto, activo: t.activo,
      opcion_titulacion: opciones[0]?.nombre ?? "Desconocida",
      documentos: docs,
      asignaciones,
      dictamen: dictamenData.length > 0 ? dictamenData[0] : null,
      progreso: { total, aprobados, rechazados, cargados: 0, en_revision: 0, pendientes: 0, color_semaforo: color, porcentaje },
    };
  }

  async aprobarDocumento(doc_id: number, admin_id: number): Promise<{ success: boolean; tramite_id?: number; error?: string }> {
    const docs = await query<{ id: number; tramite_id: number; estatus: string; tipo_documento_id: number }[]>(
      "SELECT id, tramite_id, estatus, tipo_documento_id FROM documentos WHERE id = ?", [doc_id]
    );
    if (docs.length === 0) return { success: false, error: "Documento no encontrado." };

    const doc = docs[0];

    await query("UPDATE documentos SET estatus = 'aprobado', fecha_revision = NOW(), revisado_por = ? WHERE id = ?", [admin_id, doc_id]);
    await query("INSERT INTO historial_estados (tramite_id, documento_id, estado_anterior, estado_nuevo, comentario, usuario_id) VALUES (?, ?, ?, 'aprobado', 'Documento aprobado por administración.', ?)", [doc.tramite_id, doc_id, doc.estatus, admin_id]);

    const tipo = await query<{ nombre: string }[]>("SELECT nombre FROM tipos_documento WHERE id = ?", [doc.tipo_documento_id]);
    await notificacionService.create({
      usuario_id: (await query<{ usuario_id: number }[]>("SELECT usuario_id FROM tramites WHERE id = ?", [doc.tramite_id]))[0].usuario_id,
      titulo: "Documento Aprobado",
      mensaje: `Tu documento "${tipo[0]?.nombre}" ha sido aprobado por el comité de titulación.`,
      tipo: "ambos",
      tramite_id: doc.tramite_id,
    });

    await bitacoraService.log({
      usuario_id: admin_id,
      accion: "Aprobación de documento",
      entidad: "documentos",
      entidad_id: doc_id,
      detalle: { tipo: tipo[0]?.nombre, tramite_id: doc.tramite_id },
    });

    // Recalcular estatus del trámite
    await this.actualizarEstatusTramite(doc.tramite_id);

    return { success: true, tramite_id: doc.tramite_id };
  }

  async rechazarDocumento(doc_id: number, admin_id: number, motivo: string): Promise<{ success: boolean; tramite_id?: number; error?: string }> {
    const docs = await query<{ id: number; tramite_id: number; estatus: string; tipo_documento_id: number }[]>(
      "SELECT id, tramite_id, estatus, tipo_documento_id FROM documentos WHERE id = ?", [doc_id]
    );
    if (docs.length === 0) return { success: false, error: "Documento no encontrado." };

    const doc = docs[0];

    await query("UPDATE documentos SET estatus = 'rechazado', motivo_rechazo = ?, fecha_revision = NOW(), revisado_por = ? WHERE id = ?", [motivo, admin_id, doc_id]);
    await query("INSERT INTO historial_estados (tramite_id, documento_id, estado_anterior, estado_nuevo, comentario, usuario_id) VALUES (?, ?, ?, 'rechazado', ?, ?)", [doc.tramite_id, doc_id, doc.estatus, motivo, admin_id]);

    const tipo = await query<{ nombre: string }[]>("SELECT nombre FROM tipos_documento WHERE id = ?", [doc.tipo_documento_id]);

    await notificacionService.create({
      usuario_id: (await query<{ usuario_id: number }[]>("SELECT usuario_id FROM tramites WHERE id = ?", [doc.tramite_id]))[0].usuario_id,
      titulo: "Documento Rechazado",
      mensaje: `Tu documento "${tipo[0]?.nombre}" fue rechazado. Motivo: ${motivo}`,
      tipo: "ambos",
      tramite_id: doc.tramite_id,
    });

    await bitacoraService.log({
      usuario_id: admin_id,
      accion: "Rechazo de documento",
      entidad: "documentos",
      entidad_id: doc_id,
      detalle: { tipo: tipo[0]?.nombre, tramite_id: doc.tramite_id, motivo },
    });

    await this.actualizarEstatusTramite(doc.tramite_id);

    return { success: true, tramite_id: doc.tramite_id };
  }

  async emitirDictamen(tramite_id: number, resultado: "aprobado" | "rechazado", observaciones: string, admin_id: number): Promise<{ success: boolean; error?: string }> {
    const tramite = await query<{ id: number; estatus: string; usuario_id: number }[]>(
      "SELECT id, estatus, usuario_id FROM tramites WHERE id = ? AND activo = 1", [tramite_id]
    );
    if (tramite.length === 0) return { success: false, error: "Trámite no encontrado." };

    if (resultado === "aprobado") {
      const docsObligatorios = await query<{ estatus: string; nombre: string }[]>(
        `SELECT d.estatus, td.nombre FROM documentos d
         JOIN tipos_documento td ON d.tipo_documento_id = td.id
         WHERE d.tramite_id = ? AND td.obligatorio = 1`,
        [tramite_id]
      );
      const pendientes = docsObligatorios.filter((d) => d.estatus !== "aprobado");
      if (pendientes.length > 0) {
        const nombres = pendientes.map((d) => d.nombre).join(", ");
        return {
          success: false,
          error: `No se puede aprobar el dictamen. Los siguientes documentos obligatorios no han sido aprobados: ${nombres}.`,
        };
      }
    }

    const existente = await query<{ id: number }[]>("SELECT id FROM dictamenes WHERE tramite_id = ?", [tramite_id]);
    if (existente.length > 0) {
      await query("UPDATE dictamenes SET resultado = ?, observaciones = ?, emitido_por = ?, fecha_emision = NOW() WHERE tramite_id = ?", [resultado, observaciones, admin_id, tramite_id]);
    } else {
      await query("INSERT INTO dictamenes (tramite_id, resultado, observaciones, emitido_por) VALUES (?, ?, ?, ?)", [tramite_id, resultado, observaciones, admin_id]);
    }

    const nuevoEstatus = resultado === "aprobado" ? "completado" : "rechazado";
    await query("UPDATE tramites SET estatus = ?, fecha_fin = NOW(), fecha_actualizacion = NOW() WHERE id = ?", [nuevoEstatus, tramite_id]);

    const mensaje = resultado === "aprobado"
      ? "Tu trámite de titulación ha sido APROBADO. Acude a ventanilla en horario 08:00–14:00 hrs para continuar."
      : `Tu trámite fue rechazado. Motivo: ${observaciones}. Contacta a Control Escolar para más información.`;

    await notificacionService.create({
      usuario_id: tramite[0].usuario_id,
      titulo: resultado === "aprobado" ? "Trámite Aprobado" : "Trámite Rechazado",
      mensaje,
      tipo: "ambos",
      tramite_id,
    });

    await bitacoraService.log({
      usuario_id: admin_id,
      accion: "Emisión de dictamen",
      entidad: "dictamenes",
      entidad_id: tramite_id,
      detalle: { resultado, observaciones },
    });

    await query("INSERT INTO historial_estados (tramite_id, documento_id, estado_anterior, estado_nuevo, comentario, usuario_id) VALUES (?, NULL, ?, ?, ?, ?)",
      [tramite_id, tramite[0].estatus, nuevoEstatus, observaciones, admin_id]);

    return { success: true };
  }

  private async actualizarEstatusTramite(tramite_id: number): Promise<void> {
    const docs = await query<{ estatus: string }[]>(
      `SELECT d.estatus FROM documentos d
       JOIN tipos_documento td ON d.tipo_documento_id = td.id
       WHERE d.tramite_id = ? AND td.obligatorio = 1`,
      [tramite_id]
    );

    const todosAprobados = docs.length > 0 && docs.every((d) => d.estatus === "aprobado");
    const algunRechazado = docs.some((d) => d.estatus === "rechazado");

    if (todosAprobados) {
      await query("UPDATE tramites SET estatus = 'aprobado', fecha_actualizacion = NOW() WHERE id = ?", [tramite_id]);
      await query("INSERT INTO historial_estados (tramite_id, documento_id, estado_anterior, estado_nuevo, comentario, usuario_id) VALUES (?, NULL, 'en_revision', 'aprobado', 'Todos los documentos obligatorios aprobados.', NULL)", [tramite_id]);
    } else if (algunRechazado) {
      await query("UPDATE tramites SET estatus = 'rechazado', fecha_actualizacion = NOW() WHERE id = ?", [tramite_id]);
    } else {
      await query("UPDATE tramites SET estatus = 'en_revision', fecha_actualizacion = NOW() WHERE id = ?", [tramite_id]);
    }
  }

  async listarDocentes() {
    return query<{
      id: number; numero_control: string; nombre_completo: string;
      grado_academico: string | null; carga_maxima: number | null; carga_actual: number;
    }[]>(`SELECT * FROM vw_carga_docente ORDER BY nombre_completo`);
  }

  async listarUsuarios(params: { search?: string; rol?: string; page: number }) {
    const limit = 20;
    const offset = (params.page - 1) * limit;
    const conditions: string[] = [];
    const vals: unknown[] = [];

    if (params.search) {
      conditions.push("(u.numero_control LIKE ? OR CONCAT(u.nombre, ' ', u.apellido_paterno) LIKE ? OR u.email LIKE ?)");
      vals.push(`%${params.search}%`, `%${params.search}%`, `%${params.search}%`);
    }
    if (params.rol) {
      conditions.push("u.rol = ?");
      vals.push(params.rol);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM usuarios u ${where}`, vals
    );
    const total = countResult[0]?.total ?? 0;

    const rows = await query(
      `SELECT u.id, u.numero_control, u.email, u.nombre, u.apellido_paterno, u.apellido_materno,
              u.rol, u.activo, u.grado_academico, u.carga_maxima, u.intentos_fallidos, u.created_at
       FROM usuarios u ${where}
       ORDER BY u.rol, u.nombre
       LIMIT ? OFFSET ?`,
      [...vals, limit, offset]
    );

    return { usuarios: rows, total, page: params.page, totalPages: Math.ceil(total / limit) };
  }

  async crearUsuario(data: {
    numero_control: string;
    email: string;
    password_hash: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    rol: "estudiante" | "asesor" | "administrativo";
    grado_academico?: string;
    carga_maxima?: number;
    asesor_id?: number;
    opcion_titulacion_id?: number;
  }): Promise<{ success: boolean; id?: number; error?: string }> {
    const existente = await query<{ id: number }[]>(
      "SELECT id FROM usuarios WHERE numero_control = ? OR email = ?",
      [data.numero_control, data.email]
    );
    if (existente.length > 0) {
      return { success: false, error: "Ya existe un usuario con ese número de control o email." };
    }

    const result = await transaction(async (q) => {
      const userResult = await q(
        `INSERT INTO usuarios (numero_control, email, password_hash, nombre, apellido_paterno, apellido_materno, rol, grado_academico, carga_maxima)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.numero_control, data.email, data.password_hash, data.nombre, data.apellido_paterno,
         data.apellido_materno || null, data.rol, data.grado_academico || null,
         data.rol === "asesor" ? (data.carga_maxima || 5) : null]
      ) as { insertId: number };

      if (data.rol === "estudiante") {
        const opcionId = data.opcion_titulacion_id || 1;
        const tramiteResult = await q(
          "INSERT INTO tramites (usuario_id, opcion_titulacion_id, estatus) VALUES (?, ?, 'en_proceso')",
          [userResult.insertId, opcionId]
        ) as { insertId: number };

        await q(
          `INSERT INTO documentos (tramite_id, tipo_documento_id, estatus)
           SELECT ?, td.id, 'pendiente'
           FROM tipos_documento td
           WHERE (td.opcion_titulacion_id IS NULL OR td.opcion_titulacion_id = ?)
             AND td.activo = 1`,
          [tramiteResult.insertId, opcionId]
        );

        if (data.asesor_id) {
          const carga = await q(
            "SELECT carga_maxima, carga_actual FROM vw_carga_docente WHERE docente_id = ?",
            [data.asesor_id]
          ) as { carga_maxima: number; carga_actual: number }[];
          if (carga.length > 0 && carga[0].carga_actual < (carga[0].carga_maxima || 5)) {
            await q(
              "INSERT INTO asignaciones (tramite_id, usuario_id, rol_asignacion) VALUES (?, ?, 'asesor')",
              [tramiteResult.insertId, data.asesor_id]
            );
          }
        }
      }

      return userResult as { insertId: number };
    });

    return { success: true, id: result.insertId };
  }

  async toggleActivo(userId: number): Promise<{ success: boolean; activo?: number; error?: string }> {
    const rows = await query<{ activo: number }[]>("SELECT activo FROM usuarios WHERE id = ?", [userId]);
    if (rows.length === 0) return { success: false, error: "Usuario no encontrado." };
    const nuevoEstado = rows[0].activo ? 0 : 1;
    await query("UPDATE usuarios SET activo = ?, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?", [nuevoEstado, userId]);
    return { success: true, activo: nuevoEstado };
  }

  async getUsuario(id: number) {
    const rows = await query("SELECT * FROM usuarios WHERE id = ?", [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async actualizarUsuario(id: number, data: {
    numero_control?: string; email?: string; password_hash?: string;
    nombre?: string; apellido_paterno?: string; apellido_materno?: string;
    rol?: string; grado_academico?: string; carga_maxima?: number;
  }): Promise<{ success: boolean; error?: string }> {
    const campos: string[] = [];
    const vals: unknown[] = [];

    if (data.numero_control !== undefined) { campos.push("numero_control = ?"); vals.push(data.numero_control); }
    if (data.email !== undefined) { campos.push("email = ?"); vals.push(data.email); }
    if (data.password_hash !== undefined) { campos.push("password_hash = ?"); vals.push(data.password_hash); }
    if (data.nombre !== undefined) { campos.push("nombre = ?"); vals.push(data.nombre); }
    if (data.apellido_paterno !== undefined) { campos.push("apellido_paterno = ?"); vals.push(data.apellido_paterno); }
    if (data.apellido_materno !== undefined) { campos.push("apellido_materno = ?"); vals.push(data.apellido_materno); }
    if (data.rol !== undefined) { campos.push("rol = ?"); vals.push(data.rol); }
    if (data.grado_academico !== undefined) { campos.push("grado_academico = ?"); vals.push(data.grado_academico); }
    if (data.carga_maxima !== undefined) { campos.push("carga_maxima = ?"); vals.push(data.carga_maxima); }

    if (campos.length === 0) return { success: false, error: "No hay campos para actualizar." };

    vals.push(id);
    await query(`UPDATE usuarios SET ${campos.join(", ")} WHERE id = ?`, vals);
    return { success: true };
  }

  async actualizarTramite(id: number, data: { opcion_titulacion_id?: number; titulo_proyecto?: string }): Promise<{ success: boolean; error?: string }> {
    const tramite = await query<{ id: number }[]>("SELECT id FROM tramites WHERE id = ? AND activo = 1", [id]);
    if (tramite.length === 0) return { success: false, error: "Trámite no encontrado." };

    const sets: string[] = [];
    const vals: unknown[] = [];

    if (data.opcion_titulacion_id !== undefined) {
      sets.push("opcion_titulacion_id = ?");
      vals.push(data.opcion_titulacion_id);
    }
    if (data.titulo_proyecto !== undefined) {
      sets.push("titulo_proyecto = ?");
      vals.push(data.titulo_proyecto);
    }

    if (sets.length === 0) return { success: false, error: "No hay campos para actualizar." };

    sets.push("fecha_actualizacion = NOW()");
    vals.push(id);
    await query(`UPDATE tramites SET ${sets.join(", ")} WHERE id = ?`, vals);
    return { success: true };
  }

  async toggleTramiteActivo(id: number): Promise<{ success: boolean; activo?: number; error?: string }> {
    const tramite = await query<{ activo: number }[]>("SELECT activo FROM tramites WHERE id = ?", [id]);
    if (tramite.length === 0) return { success: false, error: "Trámite no encontrado." };

    const nuevo = tramite[0].activo ? 0 : 1;
    await query("UPDATE tramites SET activo = ?, fecha_actualizacion = NOW() WHERE id = ?", [nuevo, id]);
    return { success: true, activo: nuevo };
  }

  async eliminarUsuario(id: number): Promise<{ success: boolean; error?: string }> {
    const rows = await query<{ rol: string; activo: number }[]>("SELECT rol, activo FROM usuarios WHERE id = ?", [id]);
    if (rows.length === 0) return { success: false, error: "Usuario no encontrado." };

    if (rows[0].rol === "administrativo") {
      const adminCount = await query<{ cnt: number }[]>(
        "SELECT COUNT(*) AS cnt FROM usuarios WHERE rol = 'administrativo' AND activo = 1"
      );
      if (adminCount[0]?.cnt <= 1) {
        return { success: false, error: "No se puede eliminar el último administrador activo." };
      }
    }

    await query("DELETE FROM usuarios WHERE id = ?", [id]);
    return { success: true };
  }
}

export const adminRepository = new AdminRepository();
