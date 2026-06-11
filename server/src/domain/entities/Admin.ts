export interface ExpedienteListItem {
  id: number;
  numero_control: string;
  nombre_completo: string;
  opcion_titulacion: string;
  estatus: string;
  titulo_proyecto: string | null;
  total_docs: number;
  docs_aprobados: number;
  docs_rechazados: number;
  color_semaforo: string;
  porcentaje: number;
  fecha_inicio: string;
  fecha_actualizacion: string;
}

export interface AdminDashboardStats {
  total_activos: number;
  pendientes_revision: number;
  dictamenes_emitidos: number;
  en_proceso: number;
  por_estatus: {
    en_proceso: number;
    en_revision: number;
    aprobado: number;
    rechazado: number;
    completado: number;
  };
}
