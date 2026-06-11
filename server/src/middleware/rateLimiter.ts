import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const loginRateLimiter = rateLimit({
  windowMs: env.LOGIN_BLOCK_MINUTES * 60 * 1000,
  max: 30,  // Protección anti-brute force. El bloqueo real por usuario (5 intentos) lo maneja el caso de uso.
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: `Demasiados intentos de inicio de sesión. Intente de nuevo en ${env.LOGIN_BLOCK_MINUTES} minutos.`,
    bloqueado: true,
  },
  skipSuccessfulRequests: false,
});
