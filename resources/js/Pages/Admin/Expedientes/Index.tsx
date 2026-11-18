import { useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Search, ChevronRight, Download, Pencil, Ban, RotateCcw, FileArchive, FileText, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Progress } from "@/components/ui/progress";
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

  const hasFilters = search.trim() !== "" || estatusFilter !== "todos";
  const openRow = (id: number) => setSelectedId(id);

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-4 px-4 py-6 sm:px-8">
      <Head title="Expedientes" />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-2xl font-extrabold">Expedientes</h1>
          <p className="tnum text-sm text-muted-foreground">
            {total} {total === 1 ? "trámite" : "trámites"} {cancelled ? "cancelados" : "activos"}
            {hasFilters ? " con los filtros aplicados" : ""}
          </p>
        </div>
        <SegmentedControl
          label="Estado del trámite"
          value={cancelled ? "cancelados" : "activos"}
          onChange={(v) => onTab(v === "cancelados")}
          options={[
            { value: "activos", label: "Activos" },
            { value: "cancelados", label: "Cancelados" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Buscar expedientes"
            placeholder="Buscar por número de control o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={estatusFilter} onValueChange={onEstatus}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por estado">
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
        <Button variant="outline" className="gap-1.5" asChild>
          <a href={`/admin/expedientes/export${exportQs.size ? `?${exportQs}` : ""}`}>
            <Download aria-hidden="true" />
            Exportar Excel
          </a>
        </Button>
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground" aria-label="Lista de expedientes">
        {expedientes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">
              {hasFilters
                ? "Ningún expediente coincide con tu búsqueda."
                : cancelled
                  ? "No hay trámites cancelados."
                  : "Todavía no hay expedientes activos."}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {hasFilters
                ? "Prueba con otro número de control o nombre, o quita el filtro de estado."
                : cancelled
                  ? "Los trámites que canceles aparecerán aquí y podrás reactivarlos."
                  : "Cuando un estudiante inicie su trámite de titulación, su expediente aparecerá en esta lista."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Estudiante</TableHead>
                <TableHead className="hidden lg:table-cell">Opción</TableHead>
                <TableHead className="hidden w-44 md:table-cell">Avance</TableHead>
                <TableHead className="hidden md:table-cell">Por revisar</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"><span className="sr-only">Abrir</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expedientes.map((exp) => {
                const porRevisar = exp.docs_cargados + exp.docs_en_revision;
                return (
                  <TableRow key={exp.id} className="cursor-pointer" onClick={() => openRow(exp.id)}>
                    <TableCell className="py-2.5">
                      <p className="text-sm font-semibold leading-snug">{exp.nombre_completo}</p>
                      <p className="tnum text-xs text-muted-foreground">
                        {exp.numero_control}
                        <span className="lg:hidden"> · {exp.opcion_titulacion}</span>
                      </p>
                      {porRevisar > 0 && (
                        <p className="tnum mt-0.5 text-xs font-semibold text-state-amber md:hidden">{porRevisar} por revisar</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden py-2.5 text-sm text-muted-foreground lg:table-cell">{exp.opcion_titulacion}</TableCell>
                    <TableCell className="hidden py-2.5 md:table-cell">
                      <div className="flex items-center gap-2">
                        <Progress value={exp.porcentaje} className="h-1.5 flex-1" aria-label={`Avance de ${exp.nombre_completo}`} />
                        <span className="tnum w-9 text-right text-xs text-muted-foreground">{exp.porcentaje}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden py-2.5 md:table-cell">
                      {porRevisar > 0 ? (
                        <span
                          className="tnum text-sm font-semibold"
                          title={`${exp.docs_cargados} recibidos, ${exp.docs_en_revision} en revisión`}
                        >
                          {porRevisar} <span className="text-xs font-normal text-muted-foreground">por revisar</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Al día</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge kind="tramite" status={exp.estatus} semaforo={exp.color_semaforo} />
                        {cancelled && <StatusBadge kind="tramite" status="cancelado" />}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 pr-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        aria-label={`Abrir expediente de ${exp.nombre_completo}`}
                        onClick={(e) => { e.stopPropagation(); openRow(exp.id); }}
                      >
                        <ChevronRight aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Paginación">
          <span className="tnum text-xs text-muted-foreground">
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
        </nav>
      )}

      <Dialog open={!!selectedId && editTramiteId === null} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-h-[88vh] w-[calc(100%-1.5rem)] max-w-2xl grid-cols-[minmax(0,1fr)] overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle className="pr-6 text-lg">
              Expediente <span className="tnum">{detalle?.id}</span>
              <span className="ml-2 text-sm font-normal text-muted-foreground">{detalle?.opcion_titulacion}</span>
            </DialogTitle>
            <DialogDescription>{detalle?.titulo_proyecto || "Sin título de proyecto"}</DialogDescription>
          </DialogHeader>
          {detalle && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Acciones del expediente">
              {detalle.activo !== 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => {
                    setEditTramiteId(detalle.id);
                    setEditOpcionId("");
                    setEditTitulo(detalle.titulo_proyecto || "");
                  }}
                >
                  <Pencil aria-hidden="true" />
                  Editar
                </Button>
              )}
              {detalle.activo !== 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  disabled={zipLoading || !detalle.documentos.some((d) => d.archivo_url)}
                  title={detalle.documentos.some((d) => d.archivo_url) ? undefined : "No hay documentos para descargar."}
                  onClick={() => void handleDownloadZip(detalle.id)}
                >
                  <FileArchive aria-hidden="true" />
                  {zipLoading ? "Preparando..." : "Descargar ZIP"}
                </Button>
              )}
              {detalle.dictamen && (
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" asChild>
                  <a href={`/admin/dictamenes/${detalle.id}/pdf`} target="_blank" rel="noreferrer">
                    <FileText aria-hidden="true" />
                    Ver Dictamen PDF
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className={`h-8 gap-1.5 text-xs sm:ml-auto ${detalle.activo === 0 ? "" : "text-state-red hover:text-state-red"}`}
                disabled={togglingId === detalle.id}
                onClick={() => handleToggleTramite(detalle.id)}
              >
                {detalle.activo === 0 ? <RotateCcw aria-hidden="true" /> : <Ban aria-hidden="true" />}
                {togglingId === detalle.id ? "..." : detalle.activo === 0 ? "Reactivar trámite" : "Cancelar trámite"}
              </Button>
            </div>
          )}
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
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base">Editar trámite #{editTramiteId}</DialogTitle>
            <DialogDescription className="sr-only">Modificar la opción de titulación o el título del proyecto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="edit-opcion" className="text-xs font-semibold">Opción de titulación</label>
              <Select value={editOpcionId} onValueChange={setEditOpcionId}>
                <SelectTrigger id="edit-opcion" className="h-9 text-sm"><SelectValue placeholder="Sin cambios" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cambios</SelectItem>
                  {optitulacion.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="edit-titulo" className="text-xs font-semibold">Título del proyecto</label>
              <Input id="edit-titulo" value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} placeholder="Sin cambios" className="h-9" />
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
