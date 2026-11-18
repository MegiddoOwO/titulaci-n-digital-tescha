export interface DocumentoInfo {
  id: number | null;
  tramite_id: number | null;
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
  fecha_subida: string | null;
  motivo_rechazo: string | null;
  bloqueado: boolean;
  motivo_bloqueo: string | null;
}

export interface Progreso {
  total: number;
  aprobados: number;
  rechazados: number;
  cargados: number;
  en_revision: number;
  pendientes: number;
  color_semaforo: "rojo" | "ambar" | "verde";
  porcentaje: number;
}

export interface Asignacion {
  rol_asignacion: "asesor" | "sinodal" | "revisor";
  nombre: string;
  apellido_paterno: string;
  grado_academico: string | null;
  email: string;
}

export interface DictamenInfo {
  resultado: "aprobado" | "rechazado";
  observaciones: string | null;
  emitido_por: string;
  fecha_emision: string;
}

export interface TramiteData {
  id: number;
  usuario_id: number;
  opcion_titulacion_id: number;
  opcion_titulacion: string;
  estatus: string;
  fecha_inicio: string;
  fecha_limite?: string | null;
  titulo_proyecto: string | null;
  documentos: DocumentoInfo[];
  asignaciones: Asignacion[];
  dictamen: DictamenInfo | null;
  progreso: Progreso;
}

export interface HistorialEntry {
  id: number;
  documento_id: number | null;
  estado_anterior: string | null;
  estado_nuevo: string;
  comentario: string | null;
  usuario_nombre: string | null;
  fecha: string;
}

export interface Notificacion {
  id: number;
  tipo: "in_app" | "email" | "ambos";
  titulo: string;
  mensaje: string;
  leida: number;
  tramite_id: number | null;
  created_at: string;
}
