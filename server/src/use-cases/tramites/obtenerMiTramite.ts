import { tramiteRepository } from "../../infrastructure/database/MysqlTramiteRepository";
import type { TramiteConDocumentos } from "../../domain/entities/Tramite";
import type { HistorialEntry } from "../../domain/entities/Documento";

export async function obtenerMiTramiteUseCase(
  usuario_id: number
): Promise<{ success: boolean; tramite?: TramiteConDocumentos; error?: string }> {
  const tramite = await tramiteRepository.getTramiteConDocumentos(usuario_id);
  if (!tramite) {
    return { success: false, error: "No se encontró un trámite activo para este usuario." };
  }
  return { success: true, tramite };
}

export async function obtenerHistorialUseCase(
  tramite_id: number,
  usuario_id: number
): Promise<{ success: boolean; historial?: HistorialEntry[]; error?: string }> {
  const tramite = await tramiteRepository.findById(tramite_id);
  if (!tramite || tramite.usuario_id !== usuario_id) {
    return { success: false, error: "Trámite no encontrado o no pertenece a este usuario." };
  }
  const historial = await tramiteRepository.getHistorial(tramite_id);
  return { success: true, historial };
}
