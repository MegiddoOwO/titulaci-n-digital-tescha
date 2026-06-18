import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { query } from "../config/database";
import { adminRepository } from "../infrastructure/database/AdminRepository";

const router = Router();

router.get(
  "/estudiantes",
  authenticate,
  authorize("asesor"),
  async (_req: Request, res: Response): Promise<void> => {
    const usuarioId = _req.user!.sub;

    const estudiantes = await query<
      {
        tramite_id: number;
        numero_control: string;
        nombre_completo: string;
        opcion_titulacion: string;
        estatus_tramite: string;
        rol_asignacion: string;
        porcentaje: number;
        color_semaforo: string;
      }[]
    >(
      `SELECT
        t.id AS tramite_id,
        u.numero_control,
        CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_completo,
        o.nombre AS opcion_titulacion,
        t.estatus AS estatus_tramite,
        a.rol_asignacion AS rol_asignacion,
        COALESCE(v.porcentaje_avance, 0) AS porcentaje,
        COALESCE(v.color_semaforo, 'ambar') AS color_semaforo
      FROM asignaciones a
      JOIN tramites t ON a.tramite_id = t.id AND t.activo = 1
      JOIN usuarios u ON t.usuario_id = u.id
      JOIN opciones_titulacion o ON t.opcion_titulacion_id = o.id
      LEFT JOIN vw_progreso_tramite v ON t.id = v.tramite_id
      WHERE a.usuario_id = ?
      ORDER BY t.fecha_actualizacion DESC`,
      [usuarioId]
    );

    res.json({ estudiantes });
  }
);

// PUT /api/asesor/documentos/:id/aprobar
router.put(
  "/documentos/:id/aprobar",
  authenticate,
  authorize("asesor"),
  async (req: Request, res: Response): Promise<void> => {
    const docId = parseInt(req.params.id, 10);
    const docs = await query<{ tramite_id: number }[]>(
      "SELECT tramite_id FROM documentos WHERE id = ?", [docId]
    );
    if (docs.length === 0) {
      res.status(404).json({ error: "Documento no encontrado." });
      return;
    }

    const asignado = await query<{ id: number }[]>(
      "SELECT id FROM asignaciones WHERE tramite_id = ? AND usuario_id = ?",
      [docs[0].tramite_id, req.user!.sub]
    );
    if (asignado.length === 0) {
      res.status(403).json({ error: "No estás asignado a este trámite." });
      return;
    }

    const result = await adminRepository.aprobarDocumento(docId, req.user!.sub);
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ message: "Documento aprobado." });
  }
);

// PUT /api/asesor/documentos/:id/rechazar
router.put(
  "/documentos/:id/rechazar",
  authenticate,
  authorize("asesor"),
  async (req: Request, res: Response): Promise<void> => {
    const docId = parseInt(req.params.id, 10);
    const { motivo } = req.body;
    if (!motivo || !motivo.trim()) {
      res.status(400).json({ error: "El motivo de rechazo es requerido." });
      return;
    }

    const docs = await query<{ tramite_id: number }[]>(
      "SELECT tramite_id FROM documentos WHERE id = ?", [docId]
    );
    if (docs.length === 0) {
      res.status(404).json({ error: "Documento no encontrado." });
      return;
    }

    const asignado = await query<{ id: number }[]>(
      "SELECT id FROM asignaciones WHERE tramite_id = ? AND usuario_id = ?",
      [docs[0].tramite_id, req.user!.sub]
    );
    if (asignado.length === 0) {
      res.status(403).json({ error: "No estás asignado a este trámite." });
      return;
    }

    const result = await adminRepository.rechazarDocumento(docId, req.user!.sub, motivo.trim());
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({ message: "Documento rechazado." });
  }
);

export default router;
