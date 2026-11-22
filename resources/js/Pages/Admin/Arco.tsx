import { formatDate } from "@/lib/format";
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Shield, CheckCircle2, Ban, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { adminLayout } from "@/components/admin/AdminLayout";
import { useAdminToasts } from "@/components/admin/adminToasts";

interface SolicitudArco {
  id: number;
  tipo: string;
  estado: string;
  detalle_solicitud: string | null;
  respuesta: string | null;
  fecha_solicitud: string;
  fecha_resolucion: string | null;
  numero_control: string;
  nombre_completo: string;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default function AdminARCO({ solicitudes }: { solicitudes: SolicitudArco[] }) {
  const { success, failure } = useAdminToasts();
  const [selected, setSelected] = useState<SolicitudArco | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [saving, setSaving] = useState(false);

  const handleResolve = (id: number, estado: "completada" | "rechazada") => {
    router.put(`/admin/solicitudes-arco/${id}`, { estado, respuesta: respuesta.trim() || null }, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setSaving(true),
      onFinish: () => setSaving(false),
      onSuccess: (p) => {
        success(p);
        setSelected(null);
        setRespuesta("");
      },
      onError: failure,
    });
  };

  const open = (s: SolicitudArco) => {
    setSelected(s);
    setRespuesta("");
  };

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-4 px-4 py-6 sm:px-8">
      <Head title="ARCO" />
      <div>
        <h1 className="text-2xl font-extrabold">Solicitudes ARCO</h1>
        <p className="tnum text-sm text-muted-foreground">
          {solicitudes.length} {solicitudes.length === 1 ? "solicitud" : "solicitudes"} de datos personales (LGPDPPSO)
        </p>
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground" aria-label="Solicitudes ARCO">
        {solicitudes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <Shield className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">No hay solicitudes ARCO pendientes.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Cuando un estudiante pida acceso, rectificación, cancelación u oposición sobre sus datos, la solicitud aparecerá aquí para responderla.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Solicitante</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12"><span className="sr-only">Procesar</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitudes.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => open(s)}>
                  <TableCell className="py-2.5">
                    <p className="text-sm font-semibold leading-snug">{s.nombre_completo}</p>
                    <p className="tnum text-xs text-muted-foreground">
                      {s.numero_control}
                      <span className="md:hidden"> · {capitalize(s.tipo)} · {formatDate(s.fecha_solicitud)}</span>
                    </p>
                  </TableCell>
                  <TableCell className="hidden py-2.5 text-sm md:table-cell">{capitalize(s.tipo)}</TableCell>
                  <TableCell className="tnum hidden py-2.5 text-sm text-muted-foreground md:table-cell">
                    {formatDate(s.fecha_solicitud)}
                  </TableCell>
                  <TableCell className="py-2.5">
                    <StatusBadge kind="arco" status={s.estado} />
                  </TableCell>
                  <TableCell className="py-2.5 pr-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      aria-label={`Procesar solicitud de ${s.nombre_completo}`}
                      onClick={(e) => { e.stopPropagation(); open(s); }}
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

      <Dialog open={selected !== null} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Procesar solicitud</DialogTitle>
                <DialogDescription>
                  {selected.nombre_completo} <span className="tnum">({selected.numero_control})</span>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Tipo</dt>
                    <dd className="font-semibold">{capitalize(selected.tipo)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Estado</dt>
                    <dd className="mt-0.5"><StatusBadge kind="arco" status={selected.estado} /></dd>
                  </div>
                </dl>
                {selected.detalle_solicitud && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Detalle</p>
                    <p className="rounded-md border bg-muted/40 p-2.5 text-sm">{selected.detalle_solicitud}</p>
                  </div>
                )}
                {selected.respuesta && (
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Respuesta registrada</p>
                    <p className="rounded-md border bg-muted/40 p-2.5 text-sm">{selected.respuesta}</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label htmlFor="arco-respuesta" className="text-xs font-semibold">Respuesta</label>
                  <Textarea
                    id="arco-respuesta"
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escribe la respuesta para el solicitante..."
                    rows={3}
                  />
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" className="gap-1.5" disabled={saving} onClick={() => handleResolve(selected.id, "rechazada")}>
                    <Ban aria-hidden="true" /> Rechazar
                  </Button>
                  <Button className="gap-1.5" disabled={saving} onClick={() => handleResolve(selected.id, "completada")}>
                    {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />} Resolver
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

AdminARCO.layout = adminLayout;
