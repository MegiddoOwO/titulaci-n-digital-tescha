import { useCallback, useEffect, useState } from "react";
import { jsonRequest } from "@/lib/http";
import type { Notificacion } from "@/types/tramite";

const POLL_MS = 30_000;

/** Notifications bell data: JSON endpoints behind the session cookie, polled like the legacy hook. */
export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const refetch = useCallback(async () => {
    try {
      const data = await jsonRequest<{ notificaciones: Notificacion[]; noLeidas: number }>("/notificaciones");
      setNotificaciones(data.notificaciones);
      setNoLeidas(data.noLeidas);
    } catch {
      // Keep the last known list; the next poll retries.
    }
  }, []);

  useEffect(() => {
    refetch();
    const id = window.setInterval(refetch, POLL_MS);
    return () => window.clearInterval(id);
  }, [refetch]);

  const marcarTodas = useCallback(async () => {
    await jsonRequest("/notificaciones/leer-todas", "PUT");
    await refetch();
  }, [refetch]);

  return { notificaciones, noLeidas, marcarTodas, refetch };
}
