import { useState, useEffect } from "react";
import { Search, Eye, Loader2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdmin } from "@/hooks/useAdmin";
import { getToken } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const semaforoColor: Record<string, string> = {
  verde: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ambar: "bg-amber-100 text-amber-800 border-amber-200",
  rojo: "bg-rose-100 text-rose-800 border-rose-200",
};

const AdminExpedientes = () => {
  const [search, setSearch] = useState("");
  const [estatusFilter, setEstatusFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [rechazarDocId, setRechazarDocId] = useState<number | null>(null);
  const [optitulacion, setOptitulacion] = useState<{ id: number; nombre: string }[]>([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editTramiteId, setEditTramiteId] = useState<number | null>(null);
  const [editOpcionId, setEditOpcionId] = useState("");
  const [editTitulo, setEditTitulo] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const { listarExpedientes, detalleExpediente, aprobarDoc, rechazarDoc } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/catalogos/opciones", { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json()).then((d: { id: number; nombre: string; activo: number }[]) => setOptitulacion(d.filter(o => o.activo)));
  }, []);

  const handleUpdateTramite = async () => {
    if (!editTramiteId) return;
    setEditSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (editOpcionId) body.opcion_titulacion_id = parseInt(editOpcionId);
      if (editTitulo.trim()) body.titulo_proyecto = editTitulo.trim();
      if (Object.keys(body).length === 0) {
        setEditTramiteId(null);
        setEditSaving(false);
        return;
      }
      const res = await fetch(`/api/admin/expedientes/${editTramiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      toast({ title: "Trámite actualizado" });
      setEditTramiteId(null);
      detalleExpediente(editTramiteId).refetch();
      listarExpedientes({ page: 1 }).refetch();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally { setEditSaving(false); }
  };

  const handleToggleTramite = async (tramiteId: number) => {
    setTogglingId(tramiteId);
    try {
      const res = await fetch(`/api/admin/expedientes/${tramiteId}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const r = await res.json();
      if (!res.ok) throw new Error(r.error);
      toast({ title: r.message });
      detalleExpediente(tramiteId).refetch();
      listarExpedientes({ page: 1 }).refetch();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally { setTogglingId(null); }
  };

  const { data, isLoading } = listarExpedientes({
    search: search || undefined,
    estatus: estatusFilter === "todos" ? undefined : estatusFilter,
    page,
  });

  const detalle = detalleExpediente(selectedId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Expedientes</h1>
        <p className="text-muted-foreground font-body text-sm">Gestiona los trámites de titulación</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de control o nombre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={estatusFilter} onValueChange={(v) => { setEstatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="en_revision">En Revisión</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={async () => {
            const qs = new URLSearchParams();
            if (search) qs.set("search", search);
            if (estatusFilter !== "todos") qs.set("estatus", estatusFilter);
            const res = await fetch(`/api/admin/expedientes/export?${qs.toString()}`, {
              headers: { Authorization: `Bearer ${getToken()}` },
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "expedientes.xlsx";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Excel
        </Button>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body text-xs">Matrícula</TableHead>
              <TableHead className="font-body text-xs">Estudiante</TableHead>
              <TableHead className="font-body text-xs">Opción</TableHead>
              <TableHead className="font-body text-xs">Avance</TableHead>
              <TableHead className="font-body text-xs">Revisión</TableHead>
              <TableHead className="font-body text-xs">Estado</TableHead>
              <TableHead className="font-body text-xs w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-navy" />
                </TableCell>
              </TableRow>
            ) : data?.expedientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No se encontraron expedientes.
                </TableCell>
              </TableRow>
            ) : (
              data?.expedientes.map((exp) => (
                <TableRow key={exp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(exp.id)}>
                  <TableCell className="font-body text-sm font-mono">{exp.numero_control}</TableCell>
                  <TableCell className="font-body text-sm font-medium">{exp.nombre_completo}</TableCell>
                  <TableCell className="font-body text-xs text-muted-foreground">{exp.opcion_titulacion}</TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <Progress value={exp.porcentaje} className="h-1.5 flex-1" />
                      <span className="font-body text-[11px] text-muted-foreground w-8">{exp.porcentaje}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(exp.docs_cargados + exp.docs_en_revision) > 0 && (
                      <Badge className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 cursor-help hover:bg-orange-100 transition-colors" title={`${exp.docs_cargados} cargados, ${exp.docs_en_revision} en revisión`}>
                        {exp.docs_cargados + exp.docs_en_revision} por revisar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] transition-colors ${semaforoColor[exp.color_semaforo] || "bg-gray-100"}`}>
                      {exp.estatus.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Página {data.page} de {data.totalPages} ({data.total} expedientes)
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Anterior
            </Button>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Expediente {detalle.data?.id}
              <span className="ml-2 text-sm text-muted-foreground font-normal">
                — {detalle.data?.opcion_titulacion}
              </span>
            </DialogTitle>
            <DialogDescription className="font-body text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span>{detalle.data?.titulo_proyecto || "Sin título de proyecto"}</span>
                <button
                  className="text-[10px] text-navy hover:underline"
                  onClick={() => {
                    setEditTramiteId(detalle.data!.id);
                    setEditOpcionId("");
                    setEditTitulo(detalle.data?.titulo_proyecto || "");
                  }}
                >
                  Editar
                </button>
                <button
                  className="text-[10px] px-2 py-0.5 rounded border text-rose-600 hover:bg-rose-50"
                  disabled={togglingId === detalle.data?.id}
                  onClick={() => handleToggleTramite(detalle.data!.id)}
                >
                  {togglingId === detalle.data?.id ? "..." : "Cancelar trámite"}
                </button>
                <button
                  className="text-[10px] px-2 py-0.5 rounded border text-navy hover:bg-navy/10 flex items-center gap-1"
                  onClick={async () => {
                    const res = await fetch(`/api/admin/expedientes/${detalle.data!.id}/descargar`, {
                      headers: { Authorization: `Bearer ${getToken()}` },
                    });
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `expediente_${detalle.data!.id}.zip`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Descargar ZIP
                </button>
                {(detalle.data as { dictamen?: { resultado: string } | null } | undefined)?.dictamen && (
                  <button
                    className="text-[10px] px-2 py-0.5 rounded border text-emerald-600 hover:bg-emerald-50 flex items-center gap-1"
                    onClick={() => {
                      window.open(`/api/admin/dictamenes/${detalle.data!.id}/pdf?token=${getToken()}`, "_blank");
                    }}
                  >
                    Ver Dictamen PDF
                  </button>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          {detalle.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  detalle.data?.progreso.color_semaforo === "verde" ? "bg-emerald-500" :
                  detalle.data?.progreso.color_semaforo === "rojo" ? "bg-rose-500" : "bg-amber-500"
                }`} />
                <span className="text-xs font-medium">{detalle.data?.estatus.replace(/_/g, " ")}</span>
                <span className="text-xs text-muted-foreground">— {detalle.data?.progreso.porcentaje}%</span>
              </div>
              {detalle.data?.documentos.map((doc) => (
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
                    <Badge className={`text-[10px] transition-colors ${
                      doc.estatus === "aprobado" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
                      doc.estatus === "rechazado" ? "bg-rose-100 text-rose-700 hover:bg-rose-200" :
                      doc.estatus === "cargado" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
                      doc.estatus === "en_revision" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" :
                      "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                      {doc.estatus === "cargado" ? "Recibido" : doc.estatus === "en_revision" ? "En Revisión" : doc.estatus}
                    </Badge>
                    {doc.id && (
                      <>
                        {doc.estatus !== "aprobado" && doc.estatus !== "rechazado" && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => aprobarDoc.mutate(doc.id!)}
                              disabled={aprobarDoc.isPending}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-[10px]"
                               onClick={() => { setSelectedId(null); setRechazarDocId(doc.id!); }}
                              disabled={rechazarDoc.isPending}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px]"
                          onClick={() => {
                            const token = getToken();
                            window.open(`/api/tramites/${detalle.data!.id}/documentos/${doc.id}?token=${token}`, "_blank");
                          }}
                        >
                          Ver
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editTramiteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="font-display text-base">Editar trámite #{editTramiteId}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs">Opción de Titulación</label>
                <Select value={editOpcionId} onValueChange={setEditOpcionId}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Sin cambios" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin cambios</SelectItem>
                    {optitulacion.map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs">Título del proyecto</label>
                <Input value={editTitulo} onChange={e => setEditTitulo(e.target.value)} placeholder="Sin cambios" className="h-9" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditTramiteId(null)}>Cancelar</Button>
                <Button size="sm" disabled={editSaving} onClick={handleUpdateTramite}>
                  {editSaving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

export default AdminExpedientes;
