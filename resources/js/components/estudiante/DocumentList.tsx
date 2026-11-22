import { formatList } from "@/lib/format";
import { AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { UploadControl } from "@/components/estudiante/UploadControl";
import { fechaCorta, megas, puedeSubir } from "@/components/estudiante/helpers";
import type { UploadState } from "@/components/estudiante/useUploadDocumento";
import type { DocumentoInfo } from "@/types/tramite";

function DocumentRow({ doc, tramiteId, state }: { doc: DocumentoInfo; tramiteId: number; state: UploadState }) {
  const error = state.errors[doc.tipo_documento_id];
  const verArchivo = doc.estatus !== "pendiente" && doc.id !== null;
  const subible = puedeSubir(doc);
  const busy = state.activeTipo === doc.tipo_documento_id;

  return (
    <li className="grid gap-2 px-4 py-3.5" aria-busy={busy}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug">{doc.tipo_documento_nombre}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {doc.tipo_documento_obligatorio === 1 ? "Obligatorio" : "Opcional"} · {formatList(doc.formato_permitido)} · máx.{" "}
            <span className="tnum">{megas(doc.tamaño_max_mb)} MB</span>
          </p>
        </div>
        <StatusBadge kind="documento" status={doc.estatus} className="shrink-0 pt-0.5" />
      </div>

      {doc.fecha_subida && (
        <p className="tnum break-words text-xs text-muted-foreground">
          Subido el {fechaCorta(doc.fecha_subida)}
          {doc.archivo_nombre ? ` · ${doc.archivo_nombre}` : ""}
        </p>
      )}

      {doc.estatus === "rechazado" && doc.motivo_rechazo && (
        <p className="text-sm font-semibold text-state-red">
          <span className="font-extrabold">Motivo del rechazo:</span> {doc.motivo_rechazo}
        </p>
      )}

      {doc.bloqueado && doc.motivo_bloqueo && <p className="text-xs text-muted-foreground">{doc.motivo_bloqueo}</p>}

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-sm font-semibold text-state-red">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>No se pudo subir: {error}</span>
        </p>
      )}

      {(subible || verArchivo) && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {subible && <UploadControl doc={doc} state={state} />}
          {verArchivo && (
            <Button asChild variant="outline">
              <a href={`/tramites/${tramiteId}/documentos/${doc.id}`} target="_blank" rel="noopener noreferrer">
                <FileText aria-hidden="true" />
                Ver archivo
                <span className="sr-only"> de {doc.tipo_documento_nombre} (se abre en otra pestaña)</span>
              </a>
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

export function DocumentList({ documentos, tramiteId, state }: { documentos: DocumentoInfo[]; tramiteId: number; state: UploadState }) {
  if (documentos.length === 0) {
    return (
      <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Tu trámite aún no tiene documentos requeridos. Si crees que es un error, contacta a Control Escolar.
      </p>
    );
  }
  return (
    <ul className="divide-y rounded-lg border bg-card" aria-label="Documentos de tu trámite">
      {documentos.map((doc) => (
        <DocumentRow key={doc.tipo_documento_id} doc={doc} tramiteId={tramiteId} state={state} />
      ))}
    </ul>
  );
}
