import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/services/api";

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
    mutationFn: async () => {
      const token = localStorage.getItem("sca_token");
      await fetch("/api/notificaciones/leer-todas", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });

  const marcarUna = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("sca_token");
      await fetch(`/api/notificaciones/${id}/leida`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });

  return {
    notificaciones: query.data?.notificaciones || [],
    noLeidas: query.data?.noLeidas || 0,
    isLoading: query.isLoading,
    marcarTodas,
    marcarUna,
    refetch: query.refetch,
  };
}
