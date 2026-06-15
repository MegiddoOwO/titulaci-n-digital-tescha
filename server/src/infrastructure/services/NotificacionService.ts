import { query } from "../../config/database";
import { env } from "../../config/env";
import nodemailer from "nodemailer";

export interface Notificacion {
  id: number;
  usuario_id: number;
  tipo: "in_app" | "email" | "ambos";
  titulo: string;
  mensaje: string;
  leida: number;
  fecha_lectura: string | null;
  tramite_id: number | null;
  created_at: string;
}

class NotificacionService {
  async create(params: {
    usuario_id: number;
    titulo: string;
    mensaje: string;
    tipo?: "in_app" | "email" | "ambos";
    tramite_id?: number;
  }): Promise<void> {
    await query(
      "INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, tramite_id) VALUES (?, ?, ?, ?, ?)",
      [params.usuario_id, params.tipo || "in_app", params.titulo, params.mensaje, params.tramite_id || null]
    );

    if (params.tipo === "email" || params.tipo === "ambos") {
      await this.sendEmail(params.usuario_id, params.titulo, params.mensaje);
    }
  }

  async getByUsuario(usuario_id: number, soloNoLeidas = false): Promise<Notificacion[]> {
    const where = soloNoLeidas ? "AND leida = 0" : "";
    return query<Notificacion[]>(
      `SELECT * FROM notificaciones WHERE usuario_id = ? ${where} ORDER BY created_at DESC LIMIT 50`,
      [usuario_id]
    );
  }

  async getCountNoLeidas(usuario_id: number): Promise<number> {
    const result = await query<{ cnt: number }[]>(
      "SELECT COUNT(*) AS cnt FROM notificaciones WHERE usuario_id = ? AND leida = 0",
      [usuario_id]
    );
    return result[0]?.cnt ?? 0;
  }

  async marcarLeida(notificacion_id: number, usuario_id: number): Promise<void> {
    await query(
      "UPDATE notificaciones SET leida = 1, fecha_lectura = NOW() WHERE id = ? AND usuario_id = ?",
      [notificacion_id, usuario_id]
    );
  }

  async marcarTodasLeidas(usuario_id: number): Promise<void> {
    await query(
      "UPDATE notificaciones SET leida = 1, fecha_lectura = NOW() WHERE usuario_id = ? AND leida = 0",
      [usuario_id]
    );
  }

  private async sendEmail(usuario_id: number, titulo: string, mensaje: string): Promise<void> {
    try {
      const users = await query<{ email: string; nombre: string }[]>(
        "SELECT email, nombre FROM usuarios WHERE id = ?", [usuario_id]
      );
      if (users.length === 0) return;

      const email = users[0].email;
      const nombre = users[0].nombre;

      if (env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"SCA-TESCHA" <${env.SMTP_FROM}>`,
          to: email,
          subject: titulo,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#8A2036">SCA-TESCHA</h2>
            <p>Hola ${nombre},</p>
            <p>${mensaje}</p>
            <hr style="border-color:#efe1ca">
            <p style="color:#666;font-size:12px">Sistema de Control y Administración de Titulación</p>
          </div>`,
        });
      } else {
        console.log(`[EMAIL] Para: ${email} | Asunto: ${titulo} | ${mensaje.substring(0, 80)}...`);
      }
    } catch (err) {
      console.error("[EMAIL] Error al enviar:", err);
    }
  }
}

export class BitacoraService {
  async log(params: {
    usuario_id: number;
    accion: string;
    entidad: string;
    entidad_id?: number;
    detalle?: Record<string, unknown>;
    ip?: string;
  }): Promise<void> {
    await query(
      `INSERT INTO bitacora (usuario_id, accion, entidad, entidad_id, detalle, ip_origen)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.usuario_id,
        params.accion,
        params.entidad,
        params.entidad_id || null,
        params.detalle ? JSON.stringify(params.detalle) : null,
        params.ip || null,
      ]
    );
  }
}

export const notificacionService = new NotificacionService();
export const bitacoraService = new BitacoraService();
