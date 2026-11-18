import { useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Search, Eye, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { jsonRequest } from "@/lib/http";
import { adminLayout } from "@/components/admin/AdminLayout";
import { RechazoModal } from "@/components/admin/RechazoModal";
import { ExpedienteDocumentos } from "@/components/admin/ExpedienteDocumentos";
import { reviewDocumento, useExpedienteDetalle } from "@/components/admin/useExpedienteDetalle";
import type { ExpedienteItem } from "@/types/admin";

const semaforoColor: Record<string, string> = {
  verde: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ambar: "bg-amber-100 text-amber-800 border-amber-200",
  rojo: "bg-rose-100 text-rose-800 border-rose-200",
};

interface Props {
  expedientes: ExpedienteItem[];
  total: number;
  page: number;
  totalPages: number;
  filters: { search?: string; estatus?: string; activo?: string };
}

export default function AdminExpedientes({ expedientes, total, page, totalPages, filters }: Props) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [estatusFilter, setEstatusFilter] = useState(filters.estatus || "todos");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rechazarDocId, setRechazarDocId] = useState<number | null>(null);
  const [optitulacion, setOptitulacion] = useState<{ id: number; nombre: string }[]>([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editTramiteId, setEditTramiteId] = useState<number | null>(null);
  const [editOpcionId, setEditOpcionId] = useState("");
  const [editTitulo, setEditTitulo] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [pending, setPending] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  // Server-driven (query string): true while the "Cancelados" tab is active.
  const cancelled = filters.activo === "0";

  const { toast } = useToast();
  const { detalle, loading, refetch } = useExpedienteDetalle(selectedId);

  useEffect(() => {
    jsonRequest<{ id: number; nombre: string }[]>("/admin/opciones-titulacion").then(setOptitulacion).catch(() => {});
  }, []);

  // Server-side filtering: the query string drives the Inertia props (filters/pagination are bookmarkable).
  const visit = (next: { search: string; estatus: string; page: number; cancelled?: boolean }) => {
    router.get(
      "/admin/expedientes",
      {
        ...(next.search ? { search: next.search } : {}),
        ...((next.cancelled ?? cancelled) ? { activo: "0" } : {}),
        ...(next.estatus !== "todos" ? { estatus: next.estatus } : {}),
        ...(next.page > 1 ? { page: next.page } : {}),
      },
      { preserveState: true, preserveScroll: true, replace: true },
    );
  };

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = window.setTimeout(() => visit({ search, estatus: estatusFilter, page: 1 }), 300);
    return () => window.clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const onEstatus = (v: string) => {
    setEstatusFilter(v);
    visit({ search, estatus: v, page: 1 });
  };

  const onTab = (showCancelled: boolean) => {
    if (showCancelled !== cancelled) visit({ search, estatus: estatusFilter, page: 1, cancelled: showCancelled });
  };

  const exportQs = new URLSearchParams();
  if (search) exportQs.set("search", search);
  if (estatusFilter !== "todos") exportQs.set("estatus", estatusFilter);

  const handleUpdateTramite = () => {
    if (!editTramiteId) return;
    const body: Record<string, unknown> = {};
    if (editOpcionId && editOpcionId !== "none") body.opcion_titulacion_id = parseInt(editOpcionId);
    if (editTitulo.trim()) body.titulo_proyecto = editTitulo.trim();
    if (Object.keys(body).length === 0) {
      setEditTramiteId(null);
      return;
    }
    router.put(`/admin/expedientes/${editTramiteId}`, body as Record<string, string | number>, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setEditSaving(true),
      onFinish: () => setEditSaving(false),
      onSuccess: () => {
        toast({ title: "Trámite actualizado" });
        setEditTramiteId(null);
        void refetch();
      },
    });
  };

  // Fetch first so a 404 ("no files on disk") shows a toast instead of navigating to an error page.
  const handleDownloadZip = async (tramiteId: number) => {
    setZipLoading(true);
    try {
      const response = await fetch(`/admin/expedientes/${tramiteId}/descargar`, {
        credentials: "same-origin",
        headers: { Accept: "application/zip", "X-Requested-With": "XMLHttpRequest" },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "No hay documentos para descargar.");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `expediente_.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: "No se pudo descargar", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally {
      setZipLoading(false);
    }
  };

  const handleToggleTramite = (tramiteId: number) => {
    router.put(`/admin/expedientes/${tramiteId}/toggle`, {}, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setTogglingId(tramiteId),
      onFinish: () => setTogglingId(null),
      onSuccess: (p) => {
        toast({ title: (p.props as { flash?: { success?: string } }).flash?.success ?? "" });
        void refetch();
      },
    });
  };

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
      <Head title="Expedientes" />
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Expedientes</h1>
        <p className="text-muted-foreground font-body text-sm">Gestiona los trámites de titulación</p>
      </div>

      <div className="inline-flex rounded-md border bg-card p-0.5" role="tablist" aria-label="Estado del trámite">
        {([[false, "Activos"], [true, "Cancelados"]] as const).map(([value, label]) => (
          <button
            key={label}
            role="tab"
            aria-selected={cancelled === value}
            className={`px-3 py-1 text-sm rounded font-body ${cancelled === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            onClick={() => onTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de control o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={estatusFilter} onValueChange={onEstatus}>
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
        <Button size="sm" variant="outline" className="gap-1.5" asChild>
          <a href={`/admin/expedientes/export${exportQs.size ? `?${exportQs}` : ""}`}>
            <Download className="w-3.5 h-3.5" />
            Exportar Excel
          </a>
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
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
            {expedientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No se encontraron expedientes.
                </TableCell>
              </TableRow>
            ) : (
              expedientes.map((exp) => (
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
                      <Badge
                        className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 cursor-help hover:bg-orange-100 transition-colors"
                        title={`${exp.docs_cargados} cargados, ${exp.docs_en_revision} en revisión`}
                      >
                        {exp.docs_cargados + exp.docs_en_revision} por revisar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] transition-colors ${semaforoColor[exp.color_semaforo] || "bg-gray-100"}`}>
                      {exp.estatus.replace(/_/g, " ")}
                    </Badge>
                    {cancelled && <Badge className="ml-1 text-[10px] bg-gray-100 text-gray-700 border-gray-300">Cancelado</Badge>}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Página {page} de {totalPages} ({total} expedientes)
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => visit({ search, estatus: estatusFilter, page: page - 1 })}>
              Anterior
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => visit({ search, estatus: estatusFilter, page: page + 1 })}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedId && editTramiteId === null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Expediente {detalle?.id}
              <span className="ml-2 text-sm text-muted-foreground font-normal">
                — {detalle?.opcion_titulacion}
              </span>
            </DialogTitle>
            <DialogDescription asChild>
              <div className="font-body text-sm flex items-center gap-2 flex-wrap">
                <span>{detalle?.titulo_proyecto || "Sin título de proyecto"}</span>
                {detalle?.activo !== 0 && (
                <button
                  className="text-[10px] text-foreground hover:underline"
                  onClick={() => {
                    if (!detalle) return;
                    setEditTramiteId(detalle.id);
                    setEditOpcionId("");
                    setEditTitulo(detalle.titulo_proyecto || "");
                  }}
                >
                  Editar
                </button>
                )}
                <button
                  className={`text-[10px] px-2 py-0.5 rounded border ${detalle?.activo === 0 ? "text-emerald-700 hover:bg-emerald-50" : "text-rose-600 hover:bg-rose-50"}`}
                  disabled={togglingId === detalle?.id}
                  onClick={() => detalle && handleToggleTramite(detalle.id)}
                >
                  {togglingId === detalle?.id ? "..." : detalle?.activo === 0 ? "Reactivar trámite" : "Cancelar trámite"}
                </button>
                {detalle && detalle.activo !== 0 && (
                  <button
                    className="text-[10px] px-2 py-0.5 rounded border text-foreground hover:bg-primary/10 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={zipLoading || !detalle.documentos.some((d) => d.archivo_url)}
                    title={detalle.documentos.some((d) => d.archivo_url) ? undefined : "No hay documentos para descargar."}
                    onClick={() => void handleDownloadZip(detalle.id)}
                  >
                    {zipLoading ? "Preparando..." : "Descargar ZIP"}
                  </button>
                )}
                {detalle?.dictamen && (
                  <a
                    href={`/admin/dictamenes/${detalle.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] px-2 py-0.5 rounded border text-emerald-600 hover:bg-emerald-50 flex items-center gap-1"
                  >
                    Ver Dictamen PDF
                  </a>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <ExpedienteDocumentos
            detalle={detalle}
            loading={loading}
            pending={pending}
            readOnly={detalle?.activo === 0}
            onApprove={(id) => review(id, "aprobar")}
            onReject={(id) => { setSelectedId(null); setRechazarDocId(id); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={editTramiteId !== null} onOpenChange={(open) => { if (!open) setEditTramiteId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Editar trámite #{editTramiteId}</DialogTitle>
            <DialogDescription className="sr-only">Modificar la opción de titulación o el título del proyecto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs">Opción de Titulación</label>
              <Select value={editOpcionId} onValueChange={setEditOpcionId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Sin cambios" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cambios</SelectItem>
                  {optitulacion.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs">Título del proyecto</label>
              <Input value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} placeholder="Sin cambios" className="h-9" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditTramiteId(null)}>Cancelar</Button>
              <Button size="sm" disabled={editSaving} onClick={handleUpdateTramite}>
                {editSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

AdminExpedientes.layout = adminLayout;
