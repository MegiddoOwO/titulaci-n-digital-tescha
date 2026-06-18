import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { adminRepository } from "../infrastructure/database/AdminRepository";
import { query } from "../config/database";
import { env } from "../config/env";
import { generarDictamenPDF } from "../infrastructure/services/generarDictamenPDF";

const router = Router();

// GET /api/admin/expedientes — Listar con filtros y paginación
router.get(
  "/expedientes",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const search = (req.query.search as string) || undefined;
    const estatus = (req.query.estatus as string) || undefined;

    const result = await adminRepository.listarExpedientes({ search, estatus, page, limit });
    res.json({
      expedientes: result.expedientes,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit),
    });
  }
);

// GET /api/admin/expedientes/export — Descargar Excel
router.get(
  "/expedientes/export",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const XLSX = await import("xlsx");
    const search = (req.query.search as string) || undefined;
    const estatus = (req.query.estatus as string) || undefined;

    const result = await adminRepository.listarExpedientes({ search, estatus, page: 1, limit: 10000 });
    const data = result.expedientes.map((e) => ({
      Matrícula: e.numero_control,
      Estudiante: e.nombre_completo,
      "Opción Titulación": e.opcion_titulacion,
      Avance: `${e.porcentaje}%`,
      Estado: e.estatus,
      "Docs Aprobados": e.docs_aprobados,
      "Docs Rechazados": e.docs_rechazados,
      "Última Actualización": new Date(e.fecha_actualizacion).toLocaleDateString("es-MX"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expedientes");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=expedientes.xlsx");
    res.send(buf);
  }
);

// GET /api/admin/expedientes/:id/descargar — Descargar todos los documentos en ZIP
router.get(
  "/expedientes/:id/descargar",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const docs = await query<{ archivo_url: string; archivo_nombre: string }[]>(
      "SELECT archivo_url, archivo_nombre FROM documentos WHERE tramite_id = ? AND archivo_url IS NOT NULL",
      [id]
    );

    if (docs.length === 0) {
      res.status(404).json({ error: "No hay documentos para descargar." });
      return;
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=expediente_${id}.zip`);

    const AdmZip = (await import("adm-zip")).default;
    const zip = new AdmZip();
    const uploadsDir = path.resolve(process.cwd(), "uploads");

    for (const doc of docs) {
      const filepath = path.join(uploadsDir, doc.archivo_url);
      if (fs.existsSync(filepath)) {
        zip.addLocalFile(filepath);
      }
    }

    res.send(zip.toBuffer());
  }
);

// GET /api/admin/expedientes/:id — Detalle completo de un trámite
router.get(
  "/expedientes/:id",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const tramite = await adminRepository.getExpedienteDetalle(id);
    if (!tramite) {
      res.status(404).json({ error: "Trámite no encontrado." });
      return;
    }
    res.json(tramite);
  }
);

// PUT /api/admin/expedientes/:id — Actualizar datos del trámite
router.put(
  "/expedientes/:id",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { opcion_titulacion_id, titulo_proyecto } = req.body;
    const result = await adminRepository.actualizarTramite(id, { opcion_titulacion_id, titulo_proyecto });
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ message: "Trámite actualizado." });
  }
);

// PUT /api/admin/expedientes/:id/toggle — Cancelar/reabrir trámite
router.put(
  "/expedientes/:id/toggle",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await adminRepository.toggleTramiteActivo(id);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ message: result.activo ? "Trámite reactivado." : "Trámite cancelado.", activo: result.activo });
  }
);

// GET /api/admin/stats — Métricas del dashboard
router.get(
  "/stats",
  authenticate,
  authorize("administrativo"),
  async (_req: Request, res: Response): Promise<void> => {
    const stats = await adminRepository.getStats();
    res.json(stats);
  }
);

// PUT /api/admin/documentos/:id/aprobar
router.put(
  "/documentos/:id/aprobar",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const docId = parseInt(req.params.id, 10);
    const result = await adminRepository.aprobarDocumento(docId, req.user!.sub);
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.json({ message: "Documento aprobado correctamente.", tramite_id: result.tramite_id });
  }
);

// PUT /api/admin/documentos/:id/rechazar
router.put(
  "/documentos/:id/rechazar",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const docId = parseInt(req.params.id, 10);
    const { motivo } = req.body;

    if (!motivo || typeof motivo !== "string" || motivo.trim().length === 0) {
      res.status(400).json({ error: "El motivo de rechazo es requerido." });
      return;
    }

    const result = await adminRepository.rechazarDocumento(docId, req.user!.sub, motivo.trim());
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.json({ message: "Documento rechazado correctamente.", tramite_id: result.tramite_id });
  }
);

// POST /api/admin/dictamenes
router.post(
  "/dictamenes",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const { tramite_id, resultado, observaciones } = req.body;

    if (!tramite_id || !resultado) {
      res.status(400).json({ error: "tramite_id y resultado son requeridos." });
      return;
    }
    if (!["aprobado", "rechazado"].includes(resultado)) {
      res.status(400).json({ error: "resultado debe ser 'aprobado' o 'rechazado'." });
      return;
    }

    const result = await adminRepository.emitirDictamen(
      tramite_id,
      resultado,
      observaciones || "",
      req.user!.sub
    );

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ message: "Dictamen emitido correctamente." });
  }
);

// GET /api/admin/dictamenes/:tramite_id/pdf — Descargar dictamen en PDF
router.get(
  "/dictamenes/:tramite_id/pdf",
  async (req: Request, res: Response): Promise<void> => {
    const token = (req.query.token as string) || req.headers.authorization?.replace("Bearer ", "");
    if (!token) { res.status(401).json({ error: "Token requerido." }); return; }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: number; rol: string };
      if (decoded.rol !== "administrativo" && decoded.rol !== "estudiante") {
        res.status(403).json({ error: "Acceso denegado." }); return;
      }
      (req as Record<string, unknown>).decodedToken = decoded;
    } catch {
      res.status(401).json({ error: "Token inválido." }); return;
    }
    const tramiteId = parseInt(req.params.tramite_id, 10);
    const decoded = (req as Record<string, unknown>).decodedToken as { sub: number; rol: string };

    const dictamen = await query<{
      resultado: string; observaciones: string | null; fecha_emision: string;
      emitido_nombre: string; emitido_rol: string;
      estudiante: string; numero_control: string; opcion: string;
      usuario_id: number;
    }[]>(
      `SELECT d.resultado, d.observaciones, d.fecha_emision,
              CONCAT(ua.nombre, ' ', ua.apellido_paterno) AS emitido_nombre, ua.rol AS emitido_rol,
              CONCAT(ue.nombre, ' ', ue.apellido_paterno, ' ', COALESCE(ue.apellido_materno,'')) AS estudiante,
              ue.numero_control, o.nombre AS opcion
       FROM dictamenes d
       JOIN tramites t ON d.tramite_id = t.id
       JOIN usuarios ua ON d.emitido_por = ua.id
       JOIN usuarios ue ON t.usuario_id = ue.id
       JOIN opciones_titulacion o ON t.opcion_titulacion_id = o.id
       WHERE d.tramite_id = ?`,
      [tramiteId]
    );

    if (dictamen.length === 0) {
      res.status(404).json({ error: "Dictamen no encontrado." });
      return;
    }

    if (decoded.rol !== "administrativo" && dictamen[0].usuario_id !== decoded.sub) {
      res.status(403).json({ error: "No tienes permiso para ver este dictamen." });
      return;
    }

    const d = dictamen[0];
    generarDictamenPDF(res, {
      estudiante: d.estudiante,
      numero_control: d.numero_control,
      opcion: d.opcion,
      fecha_emision: d.fecha_emision,
      resultado: d.resultado,
      observaciones: d.observaciones,
      emitido_nombre: d.emitido_nombre,
    });
  }
);

// GET /api/admin/solicitudes-arco — Listar solicitudes ARCO
router.get(
  "/solicitudes-arco",
  authenticate,
  authorize("administrativo"),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await query(
      `SELECT sa.id, sa.tipo, sa.estado, sa.detalle_solicitud, sa.respuesta, sa.fecha_solicitud, sa.fecha_resolucion,
              u.numero_control, CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_completo
       FROM solicitudes_arco sa
       JOIN usuarios u ON sa.usuario_id = u.id
       ORDER BY sa.fecha_solicitud DESC`
    );
    res.json(rows);
  }
);

// PUT /api/admin/solicitudes-arco/:id — Procesar solicitud ARCO
router.put(
  "/solicitudes-arco/:id",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { estado, respuesta } = req.body;
    if (!estado || !["en_proceso", "completada", "rechazada"].includes(estado)) {
      res.status(400).json({ error: "Estado inválido." });
      return;
    }

    await query(
      `UPDATE solicitudes_arco SET estado = ?, respuesta = ?, fecha_resolucion = NOW() WHERE id = ?`,
      [estado, respuesta || null, id]
    );
    res.json({ message: "Solicitud actualizada." });
  }
);

// POST /api/admin/asignaciones — Asignar sinodal/revisor
router.post(
  "/asignaciones",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const { tramite_id, usuario_id, rol_asignacion } = req.body;
    if (!tramite_id || !usuario_id || !["asesor", "sinodal", "revisor"].includes(rol_asignacion)) {
      res.status(400).json({ error: "tramite_id, usuario_id y rol_asignacion (asesor|sinodal|revisor) son requeridos." });
      return;
    }

    const carga = await query<{ carga_maxima: number; carga_actual: number }[]>(
      "SELECT carga_maxima, carga_actual FROM vw_carga_docente WHERE docente_id = ?",
      [usuario_id]
    );
    if (carga.length > 0 && carga[0].carga_actual >= (carga[0].carga_maxima || 5)) {
      res.status(400).json({ error: "El docente ha alcanzado su carga máxima de asesorías." });
      return;
    }

    await query(
      "INSERT IGNORE INTO asignaciones (tramite_id, usuario_id, rol_asignacion) VALUES (?, ?, ?)",
      [tramite_id, usuario_id, rol_asignacion]
    );
    res.json({ message: "Asignación creada." });
  }
);

// DELETE /api/admin/asignaciones/:id — Eliminar asignación
router.delete(
  "/asignaciones/:id",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await query("DELETE FROM asignaciones WHERE id = ?", [id]);
    res.json({ message: "Asignación eliminada." });
  }
);

// GET /api/admin/bitacora — Visor de auditoría
router.get(
  "/bitacora",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const countResult = await query<{ total: number }[]>(
      "SELECT COUNT(*) AS total FROM bitacora"
    );
    const total = countResult[0]?.total ?? 0;

    const rows = await query(
      `SELECT b.id, b.accion, b.entidad, b.entidad_id, b.detalle, b.ip_origen, b.fecha,
              CONCAT(u.nombre, ' ', u.apellido_paterno) AS usuario_nombre
       FROM bitacora b
       LEFT JOIN usuarios u ON b.usuario_id = u.id
       ORDER BY b.fecha DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({ rows, total, page, totalPages: Math.ceil(total / limit) });
  }
);

// GET /api/admin/docentes
router.get(
  "/docentes",
  authenticate,
  authorize("administrativo"),
  async (_req: Request, res: Response): Promise<void> => {
    const docentes = await adminRepository.listarDocentes();
    res.json(docentes);
  }
);

// GET /api/admin/opciones-titulacion
router.get(
  "/opciones-titulacion",
  authenticate,
  authorize("administrativo"),
  async (_req: Request, res: Response): Promise<void> => {
    const opciones = await query<{ id: number; nombre: string }[]>(
      "SELECT id, nombre FROM opciones_titulacion WHERE activo = 1 ORDER BY nombre"
    );
    res.json(opciones);
  }
);

// GET /api/admin/usuarios — Listar usuarios con filtros
router.get(
  "/usuarios",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const search = (req.query.search as string) || undefined;
    const rol = (req.query.rol as string) || undefined;
    const result = await adminRepository.listarUsuarios({ search, rol, page });
    res.json(result);
  }
);

// POST /api/admin/usuarios — Crear nuevo usuario
router.post(
  "/usuarios",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const { numero_control, email, password, nombre, apellido_paterno, apellido_materno, rol, grado_academico, carga_maxima, asesor_id, opcion_titulacion_id } = req.body;

    if (!numero_control || !email || !password || !nombre || !apellido_paterno || !rol) {
      res.status(400).json({ error: "Campos requeridos: numero_control, email, password, nombre, apellido_paterno, rol." });
      return;
    }

    if (!["estudiante", "asesor", "administrativo"].includes(rol)) {
      res.status(400).json({ error: "Rol inválido." });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await adminRepository.crearUsuario({
      numero_control, email, password_hash, nombre, apellido_paterno,
      apellido_materno, rol, grado_academico, carga_maxima,
      asesor_id: asesor_id ? parseInt(asesor_id, 10) : undefined,
      opcion_titulacion_id: opcion_titulacion_id ? parseInt(opcion_titulacion_id, 10) : undefined,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ message: "Usuario creado correctamente.", id: result.id });
  }
);

// PUT /api/admin/usuarios/:id/toggle — Activar/desactivar usuario
router.put(
  "/usuarios/:id/toggle",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const result = await adminRepository.toggleActivo(id);
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.json({ message: result.activo ? "Usuario activado." : "Usuario desactivado.", activo: result.activo });
  }
);

// GET /api/admin/usuarios/:id — Obtener un usuario
router.get(
  "/usuarios/:id",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const usuario = await adminRepository.getUsuario(id);
    if (!usuario) { res.status(404).json({ error: "Usuario no encontrado." }); return; }
    res.json(usuario);
  }
);

// PUT /api/admin/usuarios/:id — Actualizar usuario
router.put(
  "/usuarios/:id",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const { numero_control, email, password, nombre, apellido_paterno, apellido_materno, rol, grado_academico, carga_maxima } = req.body;

    const updateData: Record<string, unknown> = {};
    if (numero_control) updateData.numero_control = numero_control;
    if (email) updateData.email = email;
    if (nombre) updateData.nombre = nombre;
    if (apellido_paterno) updateData.apellido_paterno = apellido_paterno;
    if (apellido_materno !== undefined) updateData.apellido_materno = apellido_materno;
    if (rol) updateData.rol = rol;
    if (grado_academico !== undefined) updateData.grado_academico = grado_academico;
    if (carga_maxima !== undefined) updateData.carga_maxima = carga_maxima;

    if (password && password.length > 0) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    const result = await adminRepository.actualizarUsuario(id, updateData);
    if (!result.success) { res.status(400).json({ error: result.error }); return; }
    res.json({ message: "Usuario actualizado correctamente." });
  }
);

// DELETE /api/admin/usuarios/:id — Eliminar usuario
router.delete(
  "/usuarios/:id",
  authenticate,
  authorize("administrativo"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    if (id === req.user!.sub) {
      res.status(400).json({ error: "No puede eliminarse a sí mismo." });
      return;
    }
    const result = await adminRepository.eliminarUsuario(id);
    if (!result.success) { res.status(400).json({ error: result.error }); return; }
    res.json({ message: "Usuario eliminado correctamente." });
  }
);

export default router;
