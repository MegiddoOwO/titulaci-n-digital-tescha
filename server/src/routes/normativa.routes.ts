import { Router, Request, Response } from "express";
import { query } from "../config/database";

const router = Router();

// GET /api/normativa
router.get(
  "/",
  async (req: Request, res: Response): Promise<void> => {
    const modalidadId = req.query.modalidad_id
      ? parseInt(req.query.modalidad_id as string, 10)
      : null;

    let sql = `SELECT n.id, n.titulo, n.contenido, n.categoria, n.modalidad_id, n.orden,
               o.nombre AS modalidad_nombre
               FROM normativa n
               LEFT JOIN opciones_titulacion o ON n.modalidad_id = o.id
               WHERE n.activo = 1`;
    const params: (number | string)[] = [];

    if (modalidadId) {
      sql += " AND (n.modalidad_id IS NULL OR n.modalidad_id = ?)";
      params.push(modalidadId);
    }

    sql += " ORDER BY n.orden";
    const results = await query(sql, params);
    res.json(results);
  }
);

// GET /api/normativa/:id
router.get(
  "/:id",
  async (req: Request, res: Response): Promise<void> => {
    const rows = await query(
      `SELECT n.*, o.nombre AS modalidad_nombre
       FROM normativa n LEFT JOIN opciones_titulacion o ON n.modalidad_id = o.id
       WHERE n.id = ? AND n.activo = 1`,
      [parseInt(req.params.id, 10)]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Normativa no encontrada." });
      return;
    }
    res.json(rows[0]);
  }
);

export default router;
