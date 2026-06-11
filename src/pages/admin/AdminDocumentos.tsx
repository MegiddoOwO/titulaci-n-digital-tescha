import { useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/hooks/useAdmin";

const AdminDocumentos = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [rechazarDocId, setRechazarDocId] = useState<number | null>(null);

  const { listarExpedientes, detalleExpediente, aprobarDoc, rechazarDoc } = useAdmin();

  const { data, isLoading } = listarExpedientes({
    search: search || undefined,
    page,
  });

  const detalle = detalleExpediente(selectedId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Documentos</h1>
        <p className="text-muted-foreground font-body text-sm">Revisa y valida documentos de los expedientes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar estudiante..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Expedientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : (
                data?.expedientes.map((exp) => (
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
                ))
              )}
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
            ) : detalle.isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {detalle.data?.documentos.map((doc) => (
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
                      <p className="text-[10px] text-muted-foreground mt-0.5 ml-5.5">
                        {doc.archivo_nombre || "No subido"} · {doc.formato_permitido}
                        {doc.estatus === "rechazado" && doc.motivo_rechazo && (
                          <span className="text-rose-600 block mt-0.5">Rechazado: {doc.motivo_rechazo}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-[10px] ${
                        doc.estatus === "aprobado" ? "bg-emerald-100 text-emerald-700" :
                        doc.estatus === "rechazado" ? "bg-rose-100 text-rose-700" :
                        doc.estatus === "cargado" ? "bg-blue-100 text-blue-700" :
                        doc.estatus === "en_revision" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {doc.estatus === "cargado" ? "Recibido" : doc.estatus === "en_revision" ? "En Revisión" : doc.estatus}
                      </Badge>
                      {doc.id && doc.estatus !== "aprobado" && doc.estatus !== "rechazado" && (
                        <>
                          <Button
                            size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => aprobarDoc.mutate(doc.id!)}
                            disabled={aprobarDoc.isPending}
                          >Aprobar</Button>
                          <Button
                            size="sm" variant="destructive" className="h-7 text-[10px]"
                            onClick={() => setRechazarDocId(doc.id!)}
                          >Rechazar</Button>
                        </>
                      )}
                      {doc.id && (
                        <Button
                          size="sm" variant="outline" className="h-7 text-[10px]"
                          onClick={() => {
                            const token = localStorage.getItem("sca_token");
                            window.open(`/api/tramites/${detalle.data!.id}/documentos/${doc.id}?token=${token}`, "_blank");
                          }}
                        >Ver</Button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="font-display text-base">Motivo del rechazo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe por qué se rechaza este documento..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setRechazarDocId(null); setMotivoRechazo(""); }}>
                  Cancelar
                </Button>
                <Button
                  size="sm" variant="destructive"
                  disabled={!motivoRechazo.trim() || rechazarDoc.isPending}
                  onClick={() => {
                    rechazarDoc.mutate(
                      { docId: rechazarDocId, motivo: motivoRechazo.trim() },
                      {
                        onSuccess: () => { setRechazarDocId(null); setMotivoRechazo(""); }
                      }
                    );
                  }}
                >
                  {rechazarDoc.isPending ? "Rechazando..." : "Confirmar rechazo"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentos;
