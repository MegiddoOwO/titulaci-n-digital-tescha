import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { documentoBadgeClass, documentoBadgeLabel } from "@/components/admin/documentoBadge";
import type { ExpedienteDetalle } from "@/types/admin";

/** Semaforo header + per-document review rows of the admin expediente detail. */
export function ExpedienteDocumentos({
  detalle,
  loading,
  pending,
  readOnly = false,
  onApprove,
  onReject,
}: {
  detalle: ExpedienteDetalle | null;
  loading: boolean;
  pending: boolean;
  /** Cancelled expedientes: no review actions. */
  readOnly?: boolean;
  onApprove: (docId: number) => void;
  onReject: (docId: number) => void;
}) {
  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${
          detalle?.progreso.color_semaforo === "verde" ? "bg-emerald-500" :
          detalle?.progreso.color_semaforo === "rojo" ? "bg-rose-500" : "bg-amber-500"
        }`} />
        <span className="text-xs font-medium">{detalle?.estatus.replace(/_/g, " ")}</span>
        <span className="text-xs text-muted-foreground">— {detalle?.progreso.porcentaje}%</span>
      </div>
      {detalle?.documentos.map((doc) => (
        <div
          key={doc.tipo_documento_id}
          className={`p-3 rounded-lg border flex items-center justify-between ${
            doc.estatus === "aprobado" ? "bg-emerald-50/50 border-emerald-200" :
            doc.estatus === "rechazado" ? "bg-rose-50/50 border-rose-200" :
            doc.estatus === "pendiente" ? "bg-gray-50/50" :
            "bg-blue-50/50 border-blue-100"
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">
              {doc.tipo_documento_nombre}
              {doc.tipo_documento_obligatorio === 1 && <span className="text-rose-500 ml-0.5">*</span>}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {doc.fecha_subida
                ? `Subido: ${new Date(doc.fecha_subida).toLocaleDateString("es-MX")} | ${doc.archivo_nombre || ""}`
                : "No subido aún"}
              {doc.estatus === "rechazado" && doc.motivo_rechazo && (
                <span className="text-rose-600 block">Motivo: {doc.motivo_rechazo}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`text-[10px] transition-colors ${documentoBadgeClass(doc.estatus)}`}>
              {documentoBadgeLabel(doc.estatus)}
            </Badge>
            {doc.id && (
              <>
                {!readOnly && doc.estatus !== "aprobado" && doc.estatus !== "rechazado" && (
                  <>
                    {(doc.estatus === "cargado" || doc.estatus === "en_revision") && (
                      <Button
                        size="sm"
                        className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => onApprove(doc.id!)}
                        disabled={pending}
                      >
                        Aprobar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-[10px]"
                      onClick={() => onReject(doc.id!)}
                      disabled={pending}
                    >
                      Rechazar
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" className="h-7 text-[10px]" asChild>
                  <a href={`/admin/tramites/${detalle.id}/documentos/${doc.id}`} target="_blank" rel="noreferrer">Ver</a>
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
