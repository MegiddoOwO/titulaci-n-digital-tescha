import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { query } from "../config/database";

const router = Router();

interface CatalogoItem {
  id: number;
  nombre: string;
  activo: number;
  [key: string]: unknown;
}

function crudRoutes(
  path: string,
  table: string,
  extraCols?: string[]
) {
  // GET — Listar todos
  router.get(
    `/catalogos/${path}`,
    authenticate,
    authorize("administrativo"),
    async (_req: Request, res: Response): Promise<void> => {
      const rows = await query<CatalogoItem[]>(
        `SELECT * FROM ${table} ORDER BY nombre`
      );
      res.json(rows);
    }
  );

  // POST — Crear
  router.post(
    `/catalogos/${path}`,
    authenticate,
    authorize("administrativo"),
    async (req: Request, res: Response): Promise<void> => {
      const { nombre } = req.body;
      if (!nombre || !nombre.trim()) {
        res.status(400).json({ error: "El nombre es requerido." });
        return;
      }

      const cols = ["nombre"];
      const vals: unknown[] = [nombre.trim()];
      if (extraCols) {
        for (const col of extraCols) {
          cols.push(col);
          vals.push(req.body[col] || null);
        }
      }

      const result = await query<{ insertId: number }>(
        `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
        vals
      );
      res.json({ message: "Creado correctamente.", id: result.insertId });
    }
  );

  // PUT — Actualizar
  router.put(
    `/catalogos/${path}/:id`,
    authenticate,
    authorize("administrativo"),
    async (req: Request, res: Response): Promise<void> => {
      const id = parseInt(req.params.id, 10);
      const { nombre } = req.body;
      if (!nombre || !nombre.trim()) {
        res.status(400).json({ error: "El nombre es requerido." });
        return;
      }

      const sets = ["nombre = ?"];
      const vals: unknown[] = [nombre.trim()];
      if (extraCols) {
        for (const col of extraCols) {
          if (req.body[col] !== undefined) {
            sets.push(`${col} = ?`);
            vals.push(req.body[col]);
          }
        }
      }
      vals.push(id);

      await query(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ?`, vals);
      res.json({ message: "Actualizado correctamente." });
    }
  );

  // PUT — Toggle activo
  router.put(
    `/catalogos/${path}/:id/toggle`,
    authenticate,
    authorize("administrativo"),
    async (req: Request, res: Response): Promise<void> => {
      const id = parseInt(req.params.id, 10);
      await query(
        `UPDATE ${table} SET activo = NOT activo WHERE id = ?`,
        [id]
      );
      res.json({ message: "Estado actualizado." });
    }
  );
}

// Opciones de Titulación
crudRoutes("opciones", "opciones_titulacion");

// Tipos de Documento (solo nombre por ahora)
crudRoutes("tipos-documento", "tipos_documento");

// Normativa
crudRoutes("normativa", "normativa");

// Directorio
crudRoutes("directorio", "directorio");

export default router;
