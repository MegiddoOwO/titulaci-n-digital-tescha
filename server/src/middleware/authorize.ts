import { Request, Response, NextFunction } from "express";
import type { RolUsuario } from "../domain/entities/Usuario";

/**
 * Middleware que verifica que el usuario tenga uno de los roles permitidos.
 * Usar después de authenticate.
 *
 * @example authorize("administrativo")          // solo admin
 * @example authorize("administrativo", "asesor") // admin o asesor
 * @example authorize("estudiante")              // solo estudiante
 */
export function authorize(...rolesPermitidos: RolUsuario[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Autenticación requerida." });
      return;
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      res.status(403).json({
        error: "No tiene permisos suficientes para acceder a este recurso.",
        rol_requerido: rolesPermitidos.join(" o "),
      });
      return;
    }

    next();
  };
}
