import { useState } from "react";
import { useForm } from "@inertiajs/react";
import type { DocumentoInfo } from "@/types/tramite";

/**
 * Upload of one document through Inertia (multipart `POST /tramites/{tramite}/documentos`).
 * Server messages (422 validation or business guards, in Spanish) are kept per document type so
 * they can be shown next to the row (and in the summary card); there is no error toast. The success toast comes from the
 * `flash.success` message that the shared shell already shows.
 */
export function useUploadDocumento(tramiteId: number) {
  const form = useForm<{ archivo: File | null; tipo_documento_id: number }>({ archivo: null, tipo_documento_id: 0 });
  const [activeTipo, setActiveTipo] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const setError = (tipoId: number, message: string | null) =>
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[tipoId] = message;
      else delete next[tipoId];
      return next;
    });

  const upload = (doc: DocumentoInfo, file: File) => {
    const tipoId = doc.tipo_documento_id;
    setError(tipoId, null);
    setActiveTipo(tipoId);
    form.transform(() => ({ archivo: file, tipo_documento_id: tipoId }));
    form.post(`/tramites/${tramiteId}/documentos`, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => setError(tipoId, null),
      onError: (errs) => {
        const message = Object.values(errs)[0] || "Error al subir documento";
        setError(tipoId, message);
      },
      onFinish: () => setActiveTipo(null),
    });
  };

  return {
    upload,
    uploading: form.processing,
    activeTipo,
    progress: form.progress?.percentage ?? null,
    errors,
  };
}

export type UploadState = ReturnType<typeof useUploadDocumento>;
