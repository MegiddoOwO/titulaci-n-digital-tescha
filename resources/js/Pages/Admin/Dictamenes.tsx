import { formatPercent } from "@/lib/format";
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { adminLayout } from "@/components/admin/AdminLayout";
import type { ExpedienteItem } from "@/types/admin";

export default function AdminDictamenes({ candidatos }: { candidatos: ExpedienteItem[] }) {
  const [tramiteId, setTramiteId] = useState("");
  const [resultado, setResultado] = useState("aprobado");
  const [observaciones, setObservaciones] = useState("");
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const handleEmitir = () => {
    if (!tramiteId) return;
    router.post(
      "/admin/dictamenes",
      { tramite_id: parseInt(tramiteId), resultado, observaciones: observaciones.trim() },
      {
        preserveScroll: true,
        onStart: () => setPending(true),
        onFinish: () => setPending(false),
        onSuccess: () => {
          toast({ title: "Dictamen emitido", description: "El dictamen ha sido registrado correctamente." });
          setTramiteId("");
          setObservaciones("");
        },
      },
    );
  };

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-4 px-4 py-6 sm:px-8">
      <Head title="Dictámenes" />
      <div>
        <h1 className="text-2xl font-extrabold">Dictámenes</h1>
        <p className="text-sm text-muted-foreground">Emite dictámenes oficiales de titulación</p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="min-w-0 rounded-lg border bg-card p-4 text-card-foreground" aria-labelledby="emitir-titulo">
          <h2 id="emitir-titulo" className="mb-3 text-base font-extrabold">Emitir dictamen</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="dictamen-tramite" className="text-xs font-semibold">Trámite</label>
              <Select value={tramiteId} onValueChange={setTramiteId}>
                <SelectTrigger id="dictamen-tramite">
                  <SelectValue placeholder="Elige un trámite aprobado o en revisión..." />
                </SelectTrigger>
                <SelectContent>
                  {candidatos.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.numero_control} — {c.nombre_completo} ({formatPercent(c.porcentaje)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dictamen-resultado" className="text-xs font-semibold">Resultado</label>
              <Select value={resultado} onValueChange={setResultado}>
                <SelectTrigger id="dictamen-resultado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dictamen-observaciones" className="text-xs font-semibold">Observaciones</label>
              <Textarea
                id="dictamen-observaciones"
                placeholder="Observaciones del dictamen..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </div>

            <Button className="w-full" disabled={!tramiteId || pending} onClick={handleEmitir}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}
              Emitir Dictamen
            </Button>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground" aria-labelledby="candidatos-titulo">
          <h2 id="candidatos-titulo" className="border-b px-4 py-3 text-base font-extrabold">
            Expedientes disponibles <span className="tnum text-sm font-normal text-muted-foreground">({candidatos.length})</span>
          </h2>
          {candidatos.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold">No hay expedientes listos para dictamen.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Aquí aparecen los trámites aprobados o en revisión que aún no tienen dictamen. Cada trámite recibe uno solo.
              </p>
            </div>
          ) : (
            <ul className="max-h-[440px] divide-y overflow-y-auto">
              {candidatos.map((c) => {
                const selected = tramiteId === String(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setTramiteId(String(c.id))}
                      aria-pressed={selected}
                      className={`w-full px-4 py-2.5 text-left transition-colors hover:bg-muted/60 ${
                        selected ? "bg-muted shadow-[inset_2px_0_0_hsl(var(--foreground))]" : ""
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{c.nombre_completo}</span>
                          <span className="tnum block truncate text-xs text-muted-foreground">
                            {c.numero_control} · {c.opcion_titulacion}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-0.5">
                          <StatusBadge kind="tramite" status={c.estatus} semaforo={c.color_semaforo} />
                          <span className="tnum text-xs text-muted-foreground">{formatPercent(c.porcentaje)}</span>
                        </span>
                      </span>
                      <Progress value={c.porcentaje} className="mt-2 h-1" aria-label={`Avance de ${c.nombre_completo}`} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

AdminDictamenes.layout = adminLayout;
