import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, getToken } from "@/services/api";

interface DocumentoInfo {
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

interface Progreso {
  total: number;
  aprobados: number;
  rechazados: number;
  cargados: number;
  en_revision: number;
  pendientes: number;
  color_semaforo: "rojo" | "ambar" | "verde";
  porcentaje: number;
}

interface Asignacion {
  rol_asignacion: "asesor" | "sinodal" | "revisor";
  nombre: string;
  apellido_paterno: string;
  grado_academico: string | null;
  email: string;
}

interface DictamenInfo {
  resultado: "aprobado" | "rechazado";
  observaciones: string | null;
  emitido_por: string;
  fecha_emision: string;
}

interface TramiteData {
  id: number;
  usuario_id: number;
  opcion_titulacion_id: number;
  opcion_titulacion: string;
  estatus: string;
  fecha_inicio: string;
  titulo_proyecto: string | null;
  documentos: DocumentoInfo[];
  asignaciones: Asignacion[];
  dictamen: DictamenInfo | null;
  progreso: Progreso;
}

interface HistorialEntry {
  id: number;
  documento_id: number | null;
  estado_anterior: string | null;
  estado_nuevo: string;
  comentario: string | null;
  usuario_nombre: string | null;
  fecha: string;
}

export function useTramite() {
  const queryClient = useQueryClient();

  const tramiteQuery = useQuery<TramiteData>({
    queryKey: ["mi-tramite"],
    queryFn: () => apiGet<TramiteData>("/api/tramites/mi-tramite"),
    staleTime: 30_000,
  });

  const historialQuery = useQuery<HistorialEntry[]>({
    queryKey: ["mi-tramite", "historial", tramiteQuery.data?.id],
    queryFn: () => apiGet<HistorialEntry[]>(`/api/tramites/${tramiteQuery.data!.id}/historial`),
    enabled: !!tramiteQuery.data?.id,
    staleTime: 30_000,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      tipo_documento_id,
      file,
    }: {
      tipo_documento_id: number;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append("archivo", file);
      formData.append("tipo_documento_id", String(tipo_documento_id));

      const token = getToken();
      const response = await fetch(`/api/tramites/${tramiteQuery.data!.id}/documentos`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al subir documento");
      }
      return data as { message: string; documento_id: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mi-tramite"] });
    },
  });

  return {
    tramite: tramiteQuery.data,
    tramiteError: tramiteQuery.error,
    isLoading: tramiteQuery.isLoading,
    historial: historialQuery.data || [],
    uploadDocumento: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
  };
}
