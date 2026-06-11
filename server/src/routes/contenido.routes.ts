import { Router, Request, Response } from "express";
import { query } from "../config/database";

const router = Router();

// GET /api/requisitos-fotografia
router.get(
  "/",
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await query(
      "SELECT id, descripcion, orden FROM requisitos_fotografia WHERE activo = 1 ORDER BY orden"
    );
    res.json(rows);
  }
);

export default router;
