import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import tramiteRoutes from "./routes/tramite.routes";
import notificacionRoutes from "./routes/notificacion.routes";
import directorioRoutes from "./routes/directorio.routes";
import normativaRoutes from "./routes/normativa.routes";
import contenidoRoutes from "./routes/contenido.routes";
import privacidadRoutes from "./routes/privacidad.routes";
import arcoRoutes from "./routes/arco.routes";

const app = express();

// Middleware global
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.static(path.resolve(process.cwd(), "public")));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tramites", tramiteRoutes);
app.use("/api/notificaciones", notificacionRoutes);
app.use("/api/directorio", directorioRoutes);
app.use("/api/normativa", normativaRoutes);
app.use("/api/requisitos-fotografia", contenidoRoutes);
app.use("/api/privacidad", privacidadRoutes);
app.use("/api/solicitudes-arco", arcoRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "SCA-TESCHA API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

export default app;
