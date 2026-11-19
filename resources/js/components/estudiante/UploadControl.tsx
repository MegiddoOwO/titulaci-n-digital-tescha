import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { acceptDe } from "@/components/estudiante/helpers";
import type { UploadState } from "@/components/estudiante/useUploadDocumento";
import type { DocumentoInfo } from "@/types/tramite";

interface UploadControlProps {
  doc: DocumentoInfo;
  state: UploadState;
  /** Visible label; defaults from the document state. */
  label?: string;
  /** The single filled action of the screen; every other upload button is outlined. */
  primary?: boolean;
  className?: string;
}

/**
 * Button that opens the native file picker for one document and uploads the chosen file right away.
 * The input is hidden; the button is the focusable, labelled control (it names the document).
 */
export function UploadControl({ doc, state, label, primary = false, className }: UploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = state.activeTipo === doc.tipo_documento_id;
  const text =
    label ?? (doc.estatus === "pendiente" ? "Subir" : doc.estatus === "rechazado" ? "Subir de nuevo" : "Reemplazar");

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        hidden
        tabIndex={-1}
        aria-label={`Archivo para ${doc.tipo_documento_nombre}`}
        accept={acceptDe(doc.formato_permitido)}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) state.upload(doc, file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant={primary ? "default" : "outline"}
        className={cn("aria-disabled:cursor-not-allowed aria-disabled:opacity-50", className)}
        // aria-disabled (not disabled) so keyboard focus stays on the button while the upload runs.
        aria-disabled={state.uploading || undefined}
        aria-busy={busy || undefined}
        aria-label={`${text}: ${doc.tipo_documento_nombre}`}
        onClick={() => {
          if (!state.uploading) inputRef.current?.click();
        }}
      >
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
        <span className="tnum">{busy ? `Subiendo${state.progress !== null ? ` ${state.progress}%` : "…"}` : text}</span>
      </Button>
    </>
  );
}
