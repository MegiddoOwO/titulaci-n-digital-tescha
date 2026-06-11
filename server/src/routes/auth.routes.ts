import { Router, Request, Response } from "express";
import { loginUseCase } from "../use-cases/auth/login";
import { loginRateLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// POST /api/auth/login
router.post(
  "/login",
  loginRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const { numero_control, password } = req.body;

    if (!numero_control || !password) {
      res.status(400).json({
        error: "Número de control y contraseña son requeridos.",
      });
      return;
    }

    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const result = await loginUseCase(numero_control, password, ip);

    if (result.bloqueado) {
      res.status(429).json({ error: result.error, bloqueado: true });
      return;
    }

    if (!result.success) {
      res.status(401).json({ error: result.error });
      return;
    }

    res.json({
      message: "Inicio de sesión exitoso.",
      token: result.token,
      usuario: result.usuario,
    });
  }
);

// GET /api/auth/me — Obtener datos del usuario actual desde el JWT
router.get(
  "/me",
  authenticate,
  (req: Request, res: Response): void => {
    res.json({ usuario: req.user });
  }
);

export default router;
