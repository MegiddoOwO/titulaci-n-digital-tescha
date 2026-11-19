import { formatPercent } from "@/lib/format";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LampHousing, LAMP_LABEL, toLampState } from "@/components/ui/lamp";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ExpedienteDetalle } from "@/types/admin";

/** Trámite summary line + per-document review rows of the admin expediente detail. */
export function ExpedienteDocumentos({
  detalle,
  loading,
  pending,
  readOnly = false,
  showFormat = false,
  onApprove,
  onReject,
  documentoHref = (tramiteId, docId) => `/admin/tramites/${tramiteId}/documentos/${docId}`,
}: {
  detalle: ExpedienteDetalle | null;
  loading: boolean;
  pending: boolean;
  /** Cancelled expedientes: no review actions. */
  readOnly?: boolean;
  /** Show the allowed file format next to the file name. */
  showFormat?: boolean;
  onApprove: (docId: number) => void;
  onReject: (docId: number) => void;
  /** Where "Ver" opens the file; each role has its own route (admin by default). */
  documentoHref?: (tramiteId: number, docId: number) => string;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-8" role="status" aria-label="Cargando documentos">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (!detalle) return null;

  const lampa = toLampState(detalle.progreso.color_semaforo);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 rounded-lg border bg-muted/40 p-3">
        <LampHousing state={lampa} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusBadge kind="tramite" status={detalle.estatus} semaforo={detalle.progreso.color_semaforo} />
            <span className="text-xs font-semibold text-muted-foreground">Semáforo: {LAMP_LABEL[lampa]}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="flex min-w-[140px] flex-1 items-center gap-2">
              <Progress value={detalle.progreso.porcentaje} className="h-1.5 flex-1" aria-label="Avance del expediente" />
              <span className="tnum text-xs font-semibold text-muted-foreground">{formatPercent(detalle.progreso.porcentaje)}</span>
            </div>
            <span className="tnum text-xs text-muted-foreground">
              {detalle.progreso.aprobados} de {detalle.progreso.total} aprobados
            </span>
          </div>
        </div>
      </div>

      {detalle.documentos.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Este expediente no tiene tipos de documento configurados.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {detalle.documentos.map((doc) => {
            const reviewable = !!doc.id && !readOnly && doc.estatus !== "aprobado" && doc.estatus !== "rechazado";
            return (
              <li
                key={doc.tipo_documento_id}
                className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-snug">
                    {doc.tipo_documento_nombre}
                    {doc.tipo_documento_obligatorio === 1 && (
                      <>
                        <span aria-hidden="true" className="ml-0.5 text-state-red">*</span>
                        <span className="sr-only"> (obligatorio)</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.fecha_subida ? (
                      <>
                        Subido: <span className="tnum">{new Date(doc.fecha_subida).toLocaleDateString("es-MX")}</span>
                        {doc.archivo_nombre ? ` · ${doc.archivo_nombre}` : ""}
                      </>
                    ) : (
                      "No subido aún"
                    )}
                    {showFormat && doc.formato_permitido ? ` · ${doc.formato_permitido}` : ""}
                  </p>
                  {doc.estatus === "rechazado" && doc.motivo_rechazo && (
                    <p className="mt-0.5 text-xs font-semibold text-state-red">Motivo: {doc.motivo_rechazo}</p>
                  )}
                </div>
                <div className={`flex gap-2 sm:flex-row sm:flex-nowrap sm:items-center sm:justify-end ${reviewable ? "flex-col" : "items-center justify-between"}`}>
                  <div className="sm:mr-1 sm:w-[104px] sm:shrink-0 sm:[&>span]:w-full">
                    <StatusBadge kind="documento" status={doc.estatus} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap sm:gap-2">
                  {reviewable && (doc.estatus === "cargado" || doc.estatus === "en_revision") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-11 gap-1.5 px-3.5 text-sm sm:h-8 sm:px-2.5 sm:text-xs"
                      onClick={() => onApprove(doc.id!)}
                      disabled={pending}
                      aria-label={`Aprobar ${doc.tipo_documento_nombre}`}
                    >
                      <Check aria-hidden="true" />
                      Aprobar
                    </Button>
                  )}
                  {reviewable && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-11 gap-1.5 px-3.5 text-sm text-state-red hover:text-state-red sm:h-8 sm:px-2.5 sm:text-xs"
                      onClick={() => onReject(doc.id!)}
                      disabled={pending}
                      aria-label={`Rechazar ${doc.tipo_documento_nombre}`}
                    >
                      <X aria-hidden="true" />
                      Rechazar
                    </Button>
                  )}
                  {/* fecha_subida is what the row shows as "Subido"; without it nothing was uploaded and the file route would 404. */}
                  {doc.id && doc.fecha_subida && (
                    <Button size="sm" variant="ghost" className="h-11 gap-1.5 px-3 text-sm sm:h-8 sm:px-2.5 sm:text-xs" asChild>
                      <a
                        href={documentoHref(detalle.id, doc.id)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Ver ${doc.tipo_documento_nombre} (se abre en una pestaña nueva)`}
                      >
                        <ExternalLink aria-hidden="true" />
                        Ver
                      </a>
                    </Button>
                  )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
