export interface DocumentoInfo {
  id: number;
  tramite_id: number;
  tipo_documento_id: number;
  tipo_documento_nombre: string;
  tipo_documento_obligatorio: number;
  prerrequisito_id: number | null;
  prerrequisito_nombre: string | null;
  formato_permitido: string;
  tamaño_max_mb: string;
  orden: number;
  archivo_url: string | null;
  archivo_nombre: string | null;
  archivo_tamaño: number | null;
  estatus: "pendiente" | "cargado" | "en_revision" | "aprobado" | "rechazado";
  fecha_subida: Date | null;
  revisado_por: number | null;
  fecha_revision: Date | null;
  motivo_rechazo: string | null;
  bloqueado: boolean;
  motivo_bloqueo: string | null;
}

export interface HistorialEntry {
  id: number;
  tramite_id: number;
  documento_id: number | null;
  estado_anterior: string | null;
  estado_nuevo: string;
  comentario: string | null;
  usuario_id: number | null;
  usuario_nombre: string | null;
  fecha: Date;
}
