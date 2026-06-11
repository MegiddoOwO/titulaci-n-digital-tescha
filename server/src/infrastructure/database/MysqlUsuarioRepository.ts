import { query } from "../../config/database";
import type { Usuario } from "../../domain/entities/Usuario";

export class MysqlUsuarioRepository {
  async findByNumeroControl(numero_control: string): Promise<Usuario | null> {
    const rows = await query<Usuario[]>(
      "SELECT * FROM usuarios WHERE numero_control = ? AND activo = 1",
      [numero_control]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findById(id: number): Promise<Usuario | null> {
    const rows = await query<Usuario[]>(
      "SELECT * FROM usuarios WHERE id = ? AND activo = 1",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async incrementarIntentos(id: number): Promise<void> {
    await query(
      "UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id = ?",
      [id]
    );
  }

  async resetearIntentos(id: number): Promise<void> {
    await query(
      "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
      [id]
    );
  }

  async bloquearUsuario(id: number, minutos: number): Promise<void> {
    await query(
      "UPDATE usuarios SET bloqueado_hasta = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?",
      [minutos, id]
    );
  }

  async registrarLoginExitoso(id: number): Promise<void> {
    await query(
      "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
      [id]
    );
  }

  async esUsuarioBloqueado(usuario: Usuario): Promise<boolean> {
    if (!usuario.bloqueado_hasta) return false;
    const ahora = new Date();
    const bloqueo = new Date(usuario.bloqueado_hasta);
    if (ahora < bloqueo) return true;

    // Si el bloqueo ya expiró, lo limpiamos
    await this.resetearIntentos(usuario.id);
    return false;
  }
}

export const usuarioRepository = new MysqlUsuarioRepository();
