import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, getToken, apiPut, apiPost } from "@/services/api";

interface DashboardStats {
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

interface ExpedienteItem {
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

interface ExpedienteDetalle {
  id: number;
  usuario_id: number;
  opcion_titulacion: string;
  estatus: string;
  titulo_proyecto: string | null;
  documentos: DocumentoAdmin[];
  progreso: {
    total: number;
    aprobados: number;
    rechazados: number;
    color_semaforo: string;
    porcentaje: number;
  };
}

interface DocumentoAdmin {
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

export function useAdmin() {
  const queryClient = useQueryClient();

  const stats = useQuery<DashboardStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => apiGet<DashboardStats>("/api/admin/stats"),
    staleTime: 30_000,
  });

  const listarExpedientes = (params: { search?: string; estatus?: string; page?: number }) =>
    useQuery<{ expedientes: ExpedienteItem[]; total: number; page: number; totalPages: number }>({
      queryKey: ["admin", "expedientes", params],
      queryFn: () => {
        const qs = new URLSearchParams();
        if (params.search) qs.set("search", params.search);
        if (params.estatus) qs.set("estatus", params.estatus);
        qs.set("page", String(params.page || 1));
        qs.set("limit", "20");
        return apiGet(`/api/admin/expedientes?${qs.toString()}`);
      },
      staleTime: 10_000,
    });

  const detalleExpediente = (id: number | null) =>
    useQuery<ExpedienteDetalle>({
      queryKey: ["admin", "expediente", id],
      queryFn: () => apiGet<ExpedienteDetalle>(`/api/admin/expedientes/${id}`),
      enabled: !!id,
    });

  const aprobarDoc = useMutation({
    mutationFn: async (docId: number) => {
      return apiPut(`/api/admin/documentos/${docId}/aprobar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const rechazarDoc = useMutation({
    mutationFn: async ({ docId, motivo }: { docId: number; motivo: string }) => {
      return apiPut(`/api/admin/documentos/${docId}/rechazar`, { motivo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  const emitirDictamen = useMutation({
    mutationFn: async (data: { tramite_id: number; resultado: "aprobado" | "rechazado"; observaciones: string }) => {
      return apiPost("/api/admin/dictamenes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  return { stats, listarExpedientes, detalleExpediente, aprobarDoc, rechazarDoc, emitirDictamen };
}
