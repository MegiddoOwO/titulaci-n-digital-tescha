import { formatDate } from "@/lib/format";
import type { DocumentoInfo, TramiteData } from "@/types/tramite";

/** The server accepts uploads for these states (approved and in-review documents are locked). */
export function puedeSubir(doc: DocumentoInfo): boolean {
  return (doc.estatus === "pendiente" || doc.estatus === "rechazado" || doc.estatus === "cargado") && !doc.bloqueado;
}

/** First document the student still owes: not uploaded yet or rejected, and not locked by a prerequisite. */
export function proximoDocumento(documentos: DocumentoInfo[]): DocumentoInfo | null {
  return documentos.find((d) => (d.estatus === "pendiente" || d.estatus === "rechazado") && !d.bloqueado) ?? null;
}

/** `accept` attribute for a document type, from its "PDF, JPEG" style format list. */
export function acceptDe(formato: string): string {
  return formato
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .map((f) => (f === "JPEG" || f === "JPG" ? ".jpg,.jpeg" : f === "PNG" ? ".png" : ".pdf"))
    .join(",");
}

export const fechaCorta = (iso: string) => formatDate(iso);

/** One sentence that answers "what do I do next?" for the current state of the trámite. */
export function siguientePaso(tramite: TramiteData, proximo: DocumentoInfo | null): string {
  const docs = tramite.documentos;
  if (tramite.dictamen?.resultado === "aprobado") return "Tu trámite fue aprobado. Acude a ventanilla de Control Escolar.";
  if (tramite.dictamen?.resultado === "rechazado") return "Revisa las observaciones del dictamen y contacta a tu asesor o a Control Escolar.";
  if (proximo?.estatus === "rechazado") return `Corrige y vuelve a subir: ${proximo.tipo_documento_nombre}.`;
  if (proximo) return `Sube tu documento: ${proximo.tipo_documento_nombre}.`;
  const obligatorios = docs.filter((d) => d.tipo_documento_obligatorio === 1);
  if (obligatorios.length > 0 && obligatorios.every((d) => d.estatus === "aprobado")) {
    return "Todos tus documentos están aprobados. Espera el dictamen final.";
  }
  if (docs.some((d) => d.estatus === "cargado" || d.estatus === "en_revision")) {
    return "Tus documentos están en revisión por el comité. No tienes nada pendiente por subir.";
  }
  return "No tienes documentos pendientes por subir.";
}

/** "10.00" from the database becomes "10". */
export const megas = (value: string | number) => String(Number(value));
