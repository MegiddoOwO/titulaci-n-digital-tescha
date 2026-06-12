import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { adminRepository } from "../infrastructure/database/AdminRepository";

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
    const { numero_control, email, password, nombre, apellido_paterno, apellido_materno, rol, grado_academico, carga_maxima, asesor_id } = req.body;

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
