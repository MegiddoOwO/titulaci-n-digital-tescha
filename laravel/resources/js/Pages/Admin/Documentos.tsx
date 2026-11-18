import { useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { FileText, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLayout } from "@/components/admin/AdminLayout";
import { RechazoModal } from "@/components/admin/RechazoModal";
import { documentoBadgeClass, documentoBadgeLabel } from "@/components/admin/documentoBadge";
import { reviewDocumento, useExpedienteDetalle } from "@/components/admin/useExpedienteDetalle";
import type { ExpedienteItem } from "@/types/admin";

export default function AdminDocumentos({
  expedientes,
  filters,
}: {
  expedientes: ExpedienteItem[];
  filters: { search: string };
}) {
  const [search, setSearch] = useState(filters.search);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rechazarDocId, setRechazarDocId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const { detalle, loading, refetch } = useExpedienteDetalle(selectedId);

  // Server-side search through the query string (debounced, URL kept in sync).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = window.setTimeout(
      () => router.get("/admin/documentos", search ? { search } : {}, { preserveState: true, preserveScroll: true, replace: true }),
      300,
    );
    return () => window.clearTimeout(t);
  }, [search]);

  const review = (docId: number, action: "aprobar" | "rechazar", data: Record<string, string> = {}) =>
    reviewDocumento(docId, action, data, {
      onStart: () => setPending(true),
      onFinish: () => setPending(false),
      onSuccess: () => {
        if (action === "rechazar") setRechazarDocId(null);
        void refetch();
      },
    });

  return (
    <div className="p-6 space-y-6">
      <Head title="Documentos" />
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Documentos</h1>
        <p className="text-muted-foreground font-body text-sm">Revisa y valida documentos de los expedientes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar estudiante..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Expedientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {expedientes.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => setSelectedId(exp.id)}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedId === exp.id ? "bg-muted border-l-2 border-navy" : ""
                  }`}
                >
                  <p className="font-body text-sm font-medium">{exp.nombre_completo}</p>
                  <p className="font-body text-[11px] text-muted-foreground">{exp.numero_control} · {exp.opcion_titulacion}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-[10px] ${
                      exp.color_semaforo === "verde" ? "bg-emerald-100 text-emerald-700" :
                      exp.color_semaforo === "rojo" ? "bg-rose-100 text-rose-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {exp.porcentaje}%
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{exp.estatus.replace(/_/g, " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              {selectedId ? `Documentos del expediente #${selectedId}` : "Selecciona un expediente"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedId ? (
              <p className="text-muted-foreground text-sm text-center py-8">Selecciona un expediente para revisar sus documentos.</p>
            ) : loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {detalle?.documentos.map((doc) => (
                  <div
                    key={doc.tipo_documento_id}
                    className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      doc.estatus === "aprobado" ? "bg-emerald-50/30 border-emerald-200" :
                      doc.estatus === "rechazado" ? "bg-rose-50/30 border-rose-200" :
                      doc.estatus === "pendiente" ? "bg-gray-50" : "bg-blue-50/30 border-blue-100"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs font-semibold truncate">{doc.tipo_documento_nombre}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 ml-[1.375rem]">
                        {doc.archivo_nombre || "No subido"} · {doc.formato_permitido}
                        {doc.estatus === "rechazado" && doc.motivo_rechazo && (
                          <span className="text-rose-600 block mt-0.5">Rechazado: {doc.motivo_rechazo}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-[10px] transition-colors ${documentoBadgeClass(doc.estatus)}`}>
                        {documentoBadgeLabel(doc.estatus)}
                      </Badge>
                      {doc.id && doc.estatus !== "aprobado" && doc.estatus !== "rechazado" && (
                        <>
                          {(doc.estatus === "cargado" || doc.estatus === "en_revision") && (
                            <Button
                              size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => review(doc.id!, "aprobar")}
                              disabled={pending}
                            >Aprobar</Button>
                          )}
                          <Button
                            size="sm" variant="destructive" className="h-7 text-[10px]"
                            onClick={() => setRechazarDocId(doc.id!)}
                          >Rechazar</Button>
                        </>
                      )}
                      {doc.id && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" asChild>
                          <a href={`/admin/tramites/${detalle.id}/documentos/${doc.id}`} target="_blank" rel="noreferrer">Ver</a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {rechazarDocId !== null && (
        <RechazoModal
          pending={pending}
          onCancel={() => setRechazarDocId(null)}
          onConfirm={(motivo) => review(rechazarDocId, "rechazar", { motivo })}
        />
      )}
    </div>
  );
}

AdminDocumentos.layout = adminLayout;
