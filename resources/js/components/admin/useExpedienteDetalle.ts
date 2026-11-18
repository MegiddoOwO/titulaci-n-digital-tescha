import { useCallback, useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { jsonRequest } from "@/lib/http";
import type { ExpedienteDetalle } from "@/types/admin";

/**
 * On-demand expediente detail (read-only JSON fetch, like the asesor page): an Inertia visit per
 * selection would replace the page props and URL, which the legacy master/detail never did.
 */
export function useExpedienteDetalle(id: number | null) {
  const [detalle, setDetalle] = useState<ExpedienteDetalle | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (background = false) => {
    if (!id) return;
    if (!background) setLoading(true);
    try {
      setDetalle(await jsonRequest<ExpedienteDetalle>(`/admin/expedientes/${id}`));
    } catch {
      // A background refetch can fail (e.g. just-cancelled tramite): keep the last known data.
      if (!background) setDetalle(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setDetalle(null);
    void load();
  }, [load]);

  return { detalle, loading, refetch: () => load(true) };
}

/** Approve/reject through Inertia (the redirect back re-sends the page props). */
export function reviewDocumento(
  docId: number,
  action: "aprobar" | "rechazar",
  data: Record<string, string>,
  handlers: { onStart: () => void; onFinish: () => void; onSuccess: () => void },
) {
  router.put(`/admin/documentos/${docId}/${action}`, data, { preserveScroll: true, preserveState: true, ...handlers });
}
