export interface Tramite {
  id: number;
  usuario_id: number;
  opcion_titulacion_id: number;
  estatus: "en_proceso" | "en_revision" | "aprobado" | "rechazado" | "completado";
  fecha_inicio: Date;
  fecha_actualizacion: Date;
  fecha_fin: Date | null;
  titulo_proyecto: string | null;
  activo: number;
}

export interface DictamenInfo {
  id: number;
  resultado: "aprobado" | "rechazado";
  observaciones: string | null;
  emitido_por: string;
  fecha_emision: Date;
}

export interface Asignacion {
  rol_asignacion: "asesor" | "sinodal" | "revisor";
  nombre: string;
  apellido_paterno: string;
  grado_academico: string | null;
  email: string;
}

export interface TramiteConDocumentos extends Tramite {
  opcion_titulacion: string;
  fecha_limite: string | null;
  documentos: DocumentoInfo[];
  asignaciones: Asignacion[];
  dictamen: DictamenInfo | null;
  progreso: {
    total: number;
    aprobados: number;
    rechazados: number;
    cargados: number;
    en_revision: number;
    pendientes: number;
    color_semaforo: "rojo" | "ambar" | "verde";
    porcentaje: number;
  };
}
