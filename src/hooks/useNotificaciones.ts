import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/services/api";

interface Notificacion {
  id: number;
  tipo: "in_app" | "email" | "ambos";
  titulo: string;
  mensaje: string;
  leida: number;
  tramite_id: number | null;
  created_at: string;
}

export function useNotificaciones() {
  const queryClient = useQueryClient();

  const query = useQuery<{ notificaciones: Notificacion[]; noLeidas: number }>({
    queryKey: ["notificaciones"],
    queryFn: () => apiGet("/api/notificaciones"),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const marcarTodas = useMutation({
    mutationFn: () => apiPut("/api/notificaciones/leer-todas"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });

  return {
    notificaciones: query.data?.notificaciones || [],
    noLeidas: query.data?.noLeidas || 0,
    isLoading: query.isLoading,
    marcarTodas,
    refetch: query.refetch,
  };
}
