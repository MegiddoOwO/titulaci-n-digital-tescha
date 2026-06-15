import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { uploadMiddleware } from "../middleware/upload";
import { obtenerMiTramiteUseCase, obtenerHistorialUseCase } from "../use-cases/tramites/obtenerMiTramite";
import { subirDocumentoUseCase } from "../use-cases/tramites/subirDocumento";
import { query } from "../config/database";
import { env } from "../config/env";

const router = Router();

// GET /api/tramites/mi-tramite — Estudiante ve su trámite con todos los documentos
router.get(
  "/mi-tramite",
  authenticate,
  authorize("estudiante"),
  async (req: Request, res: Response): Promise<void> => {
    const result = await obtenerMiTramiteUseCase(req.user!.sub);
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.json(result.tramite);
  }
);

// GET /api/tramites/:id/historial — Línea de tiempo del trámite
router.get(
  "/:id/historial",
  authenticate,
  authorize("estudiante"),
  async (req: Request, res: Response): Promise<void> => {
    const tramiteId = parseInt(req.params.id, 10);
    const result = await obtenerHistorialUseCase(tramiteId, req.user!.sub);
    if (!result.success) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.json(result.historial);
  }
);

// POST /api/tramites/:id/documentos — Subir documento
router.post(
  "/:id/documentos",
  authenticate,
  authorize("estudiante"),
  uploadMiddleware.single("archivo"),
  async (req: Request, res: Response): Promise<void> => {
    const tramiteId = parseInt(req.params.id, 10);
    const tipoDocumentoId = parseInt(req.body.tipo_documento_id, 10);

    if (!req.file) {
      res.status(400).json({ error: "No se recibió ningún archivo." });
      return;
    }

    if (isNaN(tipoDocumentoId)) {
      res.status(400).json({ error: "tipo_documento_id es requerido." });
      return;
    }

    const result = await subirDocumentoUseCase(
      tramiteId,
      tipoDocumentoId,
      req.user!.sub,
      {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      }
    );

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({
      message: "Documento subido correctamente.",
      documento_id: result.documentoId,
    });
  }
);

// GET /api/tramites/:id/documentos/:docId — Visualizar documento (token por header o query)
router.get(
  "/:id/documentos/:docId",
  async (req: Request, res: Response, next): Promise<void> => {
    const token = (req.query.token as string) || req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ error: "Token de acceso no proporcionado." });
      return;
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: number; rol: string };
      if (decoded.rol !== "estudiante" && decoded.rol !== "administrativo") {
        res.status(403).json({ error: "No tiene permisos para ver este recurso." });
        return;
      }
      (req as Record<string, unknown>).decodedToken = decoded;
      next();
    } catch {
      res.status(401).json({ error: "Token inválido o expirado." });
    }
  },
  async (req: Request, res: Response): Promise<void> => {
    const decoded = (req as Record<string, unknown>).decodedToken as { sub: number; rol: string };
    const docId = parseInt(req.params.docId, 10);
    const rows = await query<{ archivo_url: string; archivo_nombre: string; usuario_id: number }[]>(
      `SELECT d.archivo_url, d.archivo_nombre, t.usuario_id
       FROM documentos d
       JOIN tramites t ON d.tramite_id = t.id
       WHERE d.id = ?`,
      [docId]
    );

    if (rows.length === 0 || !rows[0].archivo_url) {
      res.status(404).json({ error: "Documento no encontrado." });
      return;
    }

    if (decoded.rol !== "administrativo" && rows[0].usuario_id !== decoded.sub) {
      res.status(403).json({ error: "No tiene permisos para ver este documento." });
      return;
    }

    const filename = rows[0].archivo_url;
    const originalName = rows[0].archivo_nombre || filename;
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    const filepath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filepath)) {
      res.status(404).json({ error: "Archivo no encontrado en el servidor." });
      return;
    }

    // Determinar Content-Type
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    // Servir inline (se abre en el navegador, no fuerza descarga)
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${originalName}"`);
    res.sendFile(filepath);
  }
);

export default router;
