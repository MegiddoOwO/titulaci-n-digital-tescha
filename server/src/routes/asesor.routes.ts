import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { query } from "../config/database";

const router = Router();

router.get(
  "/estudiantes",
  authenticate,
  authorize("asesor"),
  async (_req: Request, res: Response): Promise<void> => {
    const usuarioId = _req.user!.sub;

    const estudiantes = await query<
      {
        tramite_id: number;
        numero_control: string;
        nombre_completo: string;
        opcion_titulacion: string;
        estatus_tramite: string;
        rol_asignacion: string;
        porcentaje: number;
        color_semaforo: string;
      }[]
    >(
      `SELECT
        t.id AS tramite_id,
        u.numero_control,
        CONCAT(u.nombre, ' ', u.apellido_paterno) AS nombre_completo,
        o.nombre AS opcion_titulacion,
        t.estatus AS estatus_tramite,
        a.rol_asignacion AS rol_asignacion,
        COALESCE(v.porcentaje_avance, 0) AS porcentaje,
        COALESCE(v.color_semaforo, 'ambar') AS color_semaforo
      FROM asignaciones a
      JOIN tramites t ON a.tramite_id = t.id AND t.activo = 1
      JOIN usuarios u ON t.usuario_id = u.id
      JOIN opciones_titulacion o ON t.opcion_titulacion_id = o.id
      LEFT JOIN vw_progreso_tramite v ON t.id = v.tramite_id
      WHERE a.usuario_id = ?
      ORDER BY t.fecha_actualizacion DESC`,
      [usuarioId]
    );

    res.json({ estudiantes });
  }
);

export default router;
