import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { loginUseCase } from "../use-cases/auth/login";
import { loginRateLimiter } from "../middleware/rateLimiter";
import { authenticate } from "../middleware/authenticate";
import { query } from "../config/database";
import { env } from "../config/env";
import nodemailer from "nodemailer";

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

// POST /api/auth/forgot-password — Enviar enlace de recuperación
router.post(
  "/forgot-password",
  async (req: Request, res: Response): Promise<void> => {
    const { numero_control } = req.body;
    if (!numero_control) {
      res.status(400).json({ error: "Número de control requerido." });
      return;
    }

    const users = await query<{ id: number; email: string; nombre: string }[]>(
      "SELECT id, email, nombre FROM usuarios WHERE numero_control = ? AND activo = 1",
      [numero_control]
    );

    // Siempre respondemos igual para no filtrar usuarios
    if (users.length === 0) {
      res.json({ message: "Si el número de control existe, recibirás un correo con instrucciones." });
      return;
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await query(
      "UPDATE usuarios SET reset_token = ?, reset_expira = ? WHERE id = ?",
      [token, expira, user.id]
    );

    const resetLink = `${env.APP_URL}/reset-password?token=${token}`;

    if (env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"SCA-TESCHA" <${env.SMTP_FROM}>`,
        to: user.email,
        subject: "Recuperación de contraseña - SCA TESCHA",
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#8A2036">Recuperación de contraseña</h2>
          <p>Hola ${user.nombre},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña de acceso al Sistema de Titulación.</p>
          <p>Haz clic en el siguiente enlace (válido por 1 hora):</p>
          <p><a href="${resetLink}" style="color:#8A2036;font-weight:bold">${resetLink}</a></p>
          <p>Si no solicitaste este cambio, ignora este mensaje.</p>
          <hr style="border-color:#efe1ca">
          <p style="color:#666;font-size:12px">SCA-TESCHA — Sistema de Control y Administración de Titulación</p>
        </div>`,
      });
    }

    console.log(`[PASSWORD RESET] Token para ${user.email}: ${resetLink}`);
    res.json({ message: "Si el número de control existe, recibirás un correo con instrucciones." });
  }
);

// POST /api/auth/reset-password — Restablecer contraseña
router.post(
  "/reset-password",
  async (req: Request, res: Response): Promise<void> => {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: "Token y nueva contraseña son requeridos." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }

    const users = await query<{ id: number }[]>(
      "SELECT id FROM usuarios WHERE reset_token = ? AND reset_expira > NOW() AND activo = 1",
      [token]
    );

    if (users.length === 0) {
      res.status(400).json({ error: "Token inválido o expirado." });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    await query(
      "UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_expira = NULL, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
      [password_hash, users[0].id]
    );

    res.json({ message: "Contraseña restablecida correctamente." });
  }
);

export default router;
