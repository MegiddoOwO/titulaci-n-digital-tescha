import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { notificacionService } from "../infrastructure/services/NotificacionService";

const router = Router();

// GET /api/notificaciones — Lista notificaciones del usuario autenticado
router.get(
  "/",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const soloNoLeidas = req.query.no_leidas === "true";
    const notificaciones = await notificacionService.getByUsuario(req.user!.sub, soloNoLeidas);
    const noLeidas = await notificacionService.getCountNoLeidas(req.user!.sub);
    res.json({ notificaciones, noLeidas });
  }
);

// PUT /api/notificaciones/:id/leida — Marcar una como leída
router.put(
  "/:id/leida",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    await notificacionService.marcarLeida(id, req.user!.sub);
    res.json({ message: "Notificación marcada como leída." });
  }
);

// PUT /api/notificaciones/leer-todas — Marcar todas como leídas
router.put(
  "/leer-todas",
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    await notificacionService.marcarTodasLeidas(req.user!.sub);
    res.json({ message: "Todas las notificaciones marcadas como leídas." });
  }
);

export default router;
