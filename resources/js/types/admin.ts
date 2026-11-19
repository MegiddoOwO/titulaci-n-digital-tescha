export interface AdminStats {
  total_activos: number;
  dictamenes_emitidos: number;
  pendientes_revision: number;
  en_proceso: number;
  por_estatus: {
    en_proceso: number;
    en_revision: number;
    aprobado: number;
    rechazado: number;
    completado: number;
  };
}

export interface ExpedienteItem {
  id: number;
  numero_control: string;
  nombre_completo: string;
  opcion_titulacion: string;
  estatus: string;
  titulo_proyecto: string | null;
  total_docs: number;
  docs_aprobados: number;
  docs_rechazados: number;
  docs_cargados: number;
  docs_en_revision: number;
  color_semaforo: string;
  porcentaje: number;
  fecha_inicio: string;
  fecha_actualizacion: string;
}

export interface DocumentoAdmin {
  id: number | null;
  tipo_documento_id: number;
  tipo_documento_nombre: string;
  tipo_documento_obligatorio: number;
  formato_permitido: string;
  archivo_url: string | null;
  archivo_nombre: string | null;
  estatus: string;
  fecha_subida: string | null;
  motivo_rechazo: string | null;
  bloqueado: boolean;
}

export interface ExpedienteDetalle {
  id: number;
  usuario_id: number;
  opcion_titulacion: string;
  estatus: string;
  activo?: number;
  titulo_proyecto: string | null;
  documentos: DocumentoAdmin[];
  dictamen?: { resultado: string } | null;
  progreso: {
    total: number;
    aprobados: number;
    rechazados: number;
    color_semaforo: string;
    porcentaje: number;
  };
}

/** Per-status lamp counts: trámites of that status split by the semáforo from `vw_progreso_tramite`. */
export interface TableroEstatus {
  estatus: "en_proceso" | "en_revision" | "aprobado" | "rechazado" | "completado";
  total: number;
  rojo: number;
  ambar: number;
  verde: number;
}

export interface TableroFila {
  id: number;
  numero_control: string;
  nombre_completo: string;
  estatus: string;
  color_semaforo: string;
  docs_rechazados: number;
  /** Documents pending, loaded or in review. */
  docs_pendientes: number;
}

export interface Tablero {
  estatus: TableroEstatus[];
  /** Documents reviewed per week (Monday start), last 8 weeks, oldest first. */
  semanal: { semana: string; documentos: number }[];
  pendientes: { total: number; filas: TableroFila[] };
}
