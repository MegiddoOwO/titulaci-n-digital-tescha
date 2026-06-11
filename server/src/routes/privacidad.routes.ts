import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { query } from "../config/database";

const router = Router();

// GET /api/privacidad/consentimiento — Verificar si el usuario ya aceptó
router.get(
  "/consentimiento",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const rows = await query<{ id: number; version_aviso: string; fecha_consentimiento: string }[]>(
      "SELECT id, version_aviso, fecha_consentimiento FROM consentimientos WHERE usuario_id = ? ORDER BY id DESC LIMIT 1",
      [req.user!.sub]
    );
    if (rows.length === 0) {
      res.json({ consentido: false });
    } else {
      res.json({ consentido: true, version: rows[0].version_aviso, fecha: rows[0].fecha_consentimiento });
    }
  }
);

// POST /api/privacidad/consentimiento — Registrar aceptación
router.post(
  "/consentimiento",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const userAgent = (req.headers["user-agent"] as string) || "unknown";

    await query(
      "INSERT INTO consentimientos (usuario_id, version_aviso, ip_origen, user_agent) VALUES (?, '1.0', ?, ?)",
      [req.user!.sub, ip, userAgent]
    );

    res.json({ message: "Consentimiento registrado correctamente." });
  }
);

export default router;
