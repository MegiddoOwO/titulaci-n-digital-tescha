import { formatPercent } from "@/lib/format";
import { useMemo, useState } from "react";
import { Head } from "@inertiajs/react";
import { ChevronRight, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusBadge } from "@/components/ui/status-badge";
import { CountModule, StatusModule } from "@/components/ui/status-module";
import { toLampState, type LampCounts } from "@/components/ui/lamp";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { asesorLayout } from "@/components/asesor/AsesorLayout";
import { LoadMeter } from "@/components/asesor/LoadMeter";
import { RechazoModal } from "@/components/admin/RechazoModal";
import { ExpedienteDocumentos } from "@/components/admin/ExpedienteDocumentos";
import { reviewDocumento, useExpedienteDetalle } from "@/components/admin/useExpedienteDetalle";
import type { PageProps } from "@/types";

interface EstudianteAsignado {
  tramite_id: number;
  numero_control: string;
  nombre_completo: string;
  opcion_titulacion: string;
  estatus_tramite: string;
  rol_asignacion: string;
  porcentaje: number;
  color_semaforo: string;
}

interface Revision {
  tramite_id: number;
  por_revisar: number;
  rechazados: number;
}

type Props = {
  estudiantes: EstudianteAsignado[];
  revision: Revision[];
  carga: { actual: number; maxima: number | null };
};

type Filtro = "todos" | "pendientes" | "rechazos";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// The detail is a read-only JSON fetch (as the admin expedientes list does): an Inertia visit per
// selection would replace the page props and URL, and the list needs to stay where it is.
const EXPEDIENTE_BASE = "/asesor/expedientes";
const REVIEW_BASE = "/asesor/documentos";

export default function AsesorHome({ estudiantes, revision, carga }: PageProps<Props>) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rechazarDocId, setRechazarDocId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const { detalle, loading, refetch } = useExpedienteDetalle(selectedId, EXPEDIENTE_BASE);

  const revisionPorTramite = useMemo(() => new Map(revision.map((r) => [r.tramite_id, r])), [revision]);
  const filas = useMemo(
    () =>
      estudiantes.map((e) => ({
        ...e,
        porRevisar: revisionPorTramite.get(e.tramite_id)?.por_revisar ?? 0,
        rechazados: revisionPorTramite.get(e.tramite_id)?.rechazados ?? 0,
      })),
    [estudiantes, revisionPorTramite],
  );

  const documentosPorRevisar = filas.reduce((sum, f) => sum + f.porRevisar, 0);
  const conRechazos = filas.filter((f) => f.rechazados > 0).length;
  const lamps = filas.reduce<LampCounts>(
    (acc, f) => ({ ...acc, [toLampState(f.color_semaforo)]: acc[toLampState(f.color_semaforo)] + 1 }),
    { rojo: 0, ambar: 0, verde: 0 },
  );

  const term = search.trim().toLowerCase();
  const visibles = filas.filter(
    (f) =>
      (term === "" || f.nombre_completo.toLowerCase().includes(term) || f.numero_control.toLowerCase().includes(term)) &&
      (filtro === "todos" || (filtro === "pendientes" ? f.porRevisar > 0 : f.rechazados > 0)),
  );
  // The single filled action: the first student that has documents waiting for review.
  const primeroPendienteId = visibles.find((f) => f.porRevisar > 0)?.tramite_id;
  const seleccionado = filas.find((f) => f.tramite_id === selectedId);

  const open = (id: number) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  // Mutations go through Inertia: the redirect back re-sends the props (progress, counts), and the
  // open detail is refetched afterwards.
  const review = (docId: number, action: "aprobar" | "rechazar", data: Record<string, string> = {}) =>
    reviewDocumento(
      docId,
      action,
      data,
      {
        onStart: () => setPending(true),
        onFinish: () => setPending(false),
        onSuccess: () => {
          toast({ title: action === "aprobar" ? "Documento aprobado" : "Documento rechazado" });
          if (action === "rechazar") {
            setRechazarDocId(null);
            setDetailOpen(true);
          }
          void refetch();
        },
      },
      REVIEW_BASE,
    );

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-3.5 px-4 py-6 sm:px-8">
      <Head title="Mis estudiantes" />

      <div>
        <h1 className="text-2xl font-extrabold">Mis estudiantes</h1>
        <p className="tnum mt-0.5 text-sm text-muted-foreground">
          {plural(estudiantes.length, "estudiante asignado", "estudiantes asignados")} ·{" "}
          {plural(documentosPorRevisar, "documento por revisar", "documentos por revisar")}
        </p>
      </div>

      <section aria-label="Resumen de tu carga y revisiones" className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <LoadMeter actual={carga.actual} maxima={carga.maxima} />
          <StatusModule
            name="Estudiantes asignados"
            total={estudiantes.length}
            counts={lamps}
            unit={{ one: "estudiante", many: "estudiantes" }}
          />
          <CountModule
            name="Documentos por revisar"
            total={documentosPorRevisar}
            state={documentosPorRevisar > 0 ? "ambar" : "verde"}
            caption={documentosPorRevisar > 0 ? "Recibidos o en revisión, esperan tu decisión." : "No hay documentos esperando tu decisión."}
            unit={{ one: "documento", many: "documentos" }}
          />
          <CountModule
            name="Trámites con rechazos"
            total={conRechazos}
            state={conRechazos > 0 ? "rojo" : "verde"}
            caption={conRechazos > 0 ? "Tienen documentos rechazados que el estudiante debe corregir." : "Ningún trámite tiene documentos rechazados."}
            unit={{ one: "trámite", many: "trámites" }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Semáforo de cada trámite según sus documentos: rojo si alguno está rechazado; ámbar si alguno está pendiente,
          cargado o en revisión; verde cuando todos están aprobados.
        </p>
      </section>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Buscar estudiante"
            placeholder="Buscar por nombre o matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <SegmentedControl
          label="Filtrar estudiantes"
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "todos", label: "Todos" },
            { value: "pendientes", label: "Con pendientes de revisión", short: "Pendientes" },
            { value: "rechazos", label: "Con rechazos", short: "Rechazos" },
          ]}
          className="grid grid-cols-3 sm:flex [&>button]:px-2.5 sm:[&>button]:px-3"
        />
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground" aria-label="Estudiantes asignados">
        {visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">
              {estudiantes.length === 0 ? "No tienes estudiantes asignados." : "Ningún estudiante coincide con tu búsqueda."}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {estudiantes.length === 0
                ? "Cuando control escolar te asigne un trámite de titulación, el estudiante aparecerá en esta lista y podrás revisar sus documentos."
                : "Prueba con otro nombre o matrícula, o cambia el filtro a Todos."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Estudiante</TableHead>
                <TableHead className="hidden lg:table-cell">Opción de titulación</TableHead>
                <TableHead className="hidden w-44 md:table-cell">Avance</TableHead>
                <TableHead className="hidden md:table-cell">Por revisar</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12 md:w-44"><span className="sr-only">Acción</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((f) => (
                <TableRow key={f.tramite_id} className="cursor-pointer" onClick={() => open(f.tramite_id)}>
                  <TableCell className="py-2.5">
                    <p className="text-sm font-semibold leading-snug">{f.nombre_completo}</p>
                    <p className="tnum text-xs text-muted-foreground">
                      {f.numero_control}
                      <span className="lg:hidden"> · {f.opcion_titulacion}</span>
                    </p>
                    {f.porRevisar > 0 && (
                      <p className="tnum mt-0.5 text-xs font-semibold text-state-amber md:hidden">{f.porRevisar} por revisar</p>
                    )}
                  </TableCell>
                  <TableCell className="hidden py-2.5 text-sm text-muted-foreground lg:table-cell">{f.opcion_titulacion}</TableCell>
                  <TableCell className="hidden py-2.5 md:table-cell">
                    <div className="flex items-center gap-2">
                      <Progress value={f.porcentaje} className="h-1.5 flex-1" aria-label={`Avance de ${f.nombre_completo}`} />
                      <span className="tnum w-9 text-right text-xs text-muted-foreground">{formatPercent(f.porcentaje)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden py-2.5 md:table-cell">
                    {f.porRevisar > 0 ? (
                      <span className="tnum text-sm font-semibold">
                        {f.porRevisar} <span className="text-xs font-normal text-muted-foreground">por revisar</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Al día</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <StatusBadge kind="tramite" status={f.estatus_tramite} semaforo={f.color_semaforo} />
                  </TableCell>
                  <TableCell className="py-2.5 pr-3 text-right">
                    <Button
                      variant={f.tramite_id === primeroPendienteId ? "default" : "outline"}
                      size="sm"
                      className="hidden h-8 text-xs md:inline-flex"
                      aria-label={`Abrir expediente de ${f.nombre_completo}`}
                      onClick={(e) => { e.stopPropagation(); open(f.tramite_id); }}
                    >
                      Abrir expediente
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 md:hidden"
                      aria-label={`Abrir expediente de ${f.nombre_completo}`}
                      onClick={(e) => { e.stopPropagation(); open(f.tramite_id); }}
                    >
                      <ChevronRight aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog open={detailOpen} onOpenChange={(o) => { if (!o) setDetailOpen(false); }}>
        <DialogContent className="max-h-[88vh] w-[calc(100%-1.5rem)] max-w-2xl grid-cols-[minmax(0,1fr)] overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle className="pr-6 text-lg">{seleccionado?.nombre_completo ?? "Expediente"}</DialogTitle>
            <DialogDescription>
              <span className="tnum">{seleccionado?.numero_control}</span>
              {seleccionado ? ` · ${seleccionado.opcion_titulacion}` : ""}
            </DialogDescription>
          </DialogHeader>
          <ExpedienteDocumentos
            detalle={detalle}
            loading={loading}
            pending={pending}
            onApprove={(id) => review(id, "aprobar")}
            onReject={(id) => { setDetailOpen(false); setRechazarDocId(id); }}
            documentoHref={(tramiteId, docId) => `/asesor/tramites/${tramiteId}/documentos/${docId}`}
          />
          {!loading && !detalle && (
            <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              No se pudo cargar el expediente. Cierra esta ventana y vuelve a abrirlo.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {rechazarDocId !== null && (
        <RechazoModal
          pending={pending}
          onCancel={() => { setRechazarDocId(null); setDetailOpen(true); }}
          onConfirm={(motivo) => review(rechazarDocId, "rechazar", { motivo })}
        />
      )}
    </div>
  );
}

AsesorHome.layout = asesorLayout;
