import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { query } from "../config/database";

const router = Router();

// POST /api/solicitudes-arco — Crear solicitud ARCO
router.post(
  "/",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const { tipo, detalle } = req.body;

    if (!tipo || !["acceso", "rectificacion", "cancelacion", "oposicion"].includes(tipo)) {
      res.status(400).json({ error: "Tipo de solicitud inválido. Use: acceso, rectificación, cancelación u oposición." });
      return;
    }

    await query(
      "INSERT INTO solicitudes_arco (usuario_id, tipo, estado, detalle_solicitud) VALUES (?, ?, 'pendiente', ?)",
      [req.user!.sub, tipo, detalle || null]
    );

    res.json({ message: "Solicitud ARCO registrada. Será procesada en un máximo de 15 días hábiles." });
  }
);

// GET /api/solicitudes-arco — Ver mis solicitudes ARCO
router.get(
  "/",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const rows = await query(
      `SELECT id, tipo, estado, detalle_solicitud, respuesta, fecha_solicitud, fecha_resolucion
       FROM solicitudes_arco WHERE usuario_id = ? ORDER BY fecha_solicitud DESC`,
      [req.user!.sub]
    );
    res.json(rows);
  }
);

export default router;
