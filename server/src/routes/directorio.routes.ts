import { Router, Request, Response } from "express";
import { query } from "../config/database";

const router = Router();

// GET /api/directorio
router.get(
  "/",
  async (_req: Request, res: Response): Promise<void> => {
    const search = (typeof _req.query.search === "string" && _req.query.search.trim())
      ? `%${_req.query.search.trim()}%`
      : null;

    let sql = "SELECT id, nombre, cargo, departamento, email, telefono, extension FROM directorio WHERE activo = 1";
    const params: string[] = [];

    if (search) {
      sql += " AND (nombre LIKE ? OR cargo LIKE ? OR departamento LIKE ?)";
      params.push(search, search, search);
    }

    sql += " ORDER BY orden";
    const results = await query(sql, params);
    res.json(results);
  }
);

// GET /api/directorio/:id
router.get(
  "/:id",
  async (req: Request, res: Response): Promise<void> => {
    const rows = await query(
      "SELECT * FROM directorio WHERE id = ? AND activo = 1",
      [parseInt(req.params.id, 10)]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Contacto no encontrado." });
      return;
    }
    res.json(rows[0]);
  }
);

export default router;
