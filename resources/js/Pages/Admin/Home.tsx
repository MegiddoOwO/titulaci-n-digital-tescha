import { Head, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { LampBadge, toLampState } from "@/components/ui/lamp";
import { StatusModule } from "@/components/ui/status-module";
import { GraphiteBarChart, GraphiteLineChart } from "@/components/ui/graphite-charts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminLayout } from "@/components/admin/AdminLayout";
import type { AdminStats, Tablero, TableroFila } from "@/types/admin";

const estatusLabel: Record<string, string> = {
  en_proceso: "En proceso",
  en_revision: "En revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  completado: "Completado",
};

/** Short axis labels for narrow screens; the tooltip and table keep the full name. */
const estatusShort: Record<string, string> = {
  en_proceso: "Proceso",
  en_revision: "Revisión",
  aprobado: "Aprobado",
  rechazado: "Rechaz.",
  completado: "Compl.",
};

const dayMonth = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-11-16" -> "16 nov" (the date is a plain calendar day, so format it in UTC). */
function weekLabel(iso: string): string {
  return dayMonth.format(new Date(`${iso}T00:00:00Z`)).replace(".", "");
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function docsSummary(row: TableroFila): string {
  const parts: string[] = [];
  if (row.docs_rechazados > 0) parts.push(plural(row.docs_rechazados, "rechazado", "rechazados"));
  if (row.docs_pendientes > 0) parts.push(plural(row.docs_pendientes, "pendiente", "pendientes"));
  return parts.join(" · ");
}

export default function AdminHome({ stats, tablero }: { stats: AdminStats; tablero: Tablero }) {
  const porEstatus = tablero.estatus.map((e) => ({
    name: estatusLabel[e.estatus] ?? e.estatus,
    short: estatusShort[e.estatus],
    value: e.total,
  }));
  const semanal = tablero.semanal.map((w) => ({
    name: weekLabel(w.semana),
    value: w.documentos,
    detail: `Semana del ${weekLabel(w.semana)}`,
  }));
  const { filas, total: totalPendientes } = tablero.pendientes;
  // Only the first red trámite gets the filled action; the rest are outline.
  const firstRedId = filas.find((r) => toLampState(r.color_semaforo) === "rojo")?.id;

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-3.5 px-4 py-6 sm:px-8">
      <Head title="Resumen" />

      <div>
        <h1 className="text-2xl font-extrabold">Resumen de titulación</h1>
        <p className="tnum mt-0.5 text-sm text-muted-foreground">
          {plural(stats.total_activos, "trámite activo", "trámites activos")} ·{" "}
          {plural(stats.pendientes_revision, "documento por revisar", "documentos por revisar")}
        </p>
      </div>

      <section aria-label="Trámites por estatus" className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {tablero.estatus.map((e) => (
            <StatusModule
              key={e.estatus}
              name={estatusLabel[e.estatus] ?? e.estatus}
              total={e.total}
              counts={{ rojo: e.rojo, ambar: e.ambar, verde: e.verde }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Semáforo de cada trámite según sus documentos: rojo si alguno está rechazado; ámbar si alguno está pendiente,
          cargado o en revisión; verde cuando todos están aprobados.
        </p>
      </section>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <GraphiteBarChart
          title="Trámites por estatus"
          data={porEstatus}
          valueLabel="Trámites"
          categoryLabel="Estatus"
          emptyNote="No hay trámites activos."
        />
        <GraphiteLineChart
          title="Documentos revisados por semana"
          data={semanal}
          valueLabel="Documentos"
          categoryLabel="Semana"
          emptyNote="Sin documentos revisados en las últimas 8 semanas."
        />
      </div>

      <section className="min-w-0 rounded-lg border bg-card px-4 py-3.5 text-card-foreground" aria-labelledby="pendientes-titulo">
        <h2 id="pendientes-titulo" className="mb-2 text-[13px] font-extrabold">
          Trámites con documentos rechazados o pendientes
        </h2>

        {filas.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            Ningún trámite tiene documentos rechazados o pendientes por revisar.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="hidden sm:table-cell">Estatus</TableHead>
                  <TableHead>Semáforo</TableHead>
                  <TableHead className="hidden md:table-cell">Documentos</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Acción</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="block font-semibold">{row.nombre_completo}</span>
                      <span className="tnum block text-xs text-muted-foreground">{row.numero_control}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{estatusLabel[row.estatus] ?? row.estatus}</TableCell>
                    <TableCell>
                      <LampBadge state={toLampState(row.color_semaforo)} />
                    </TableCell>
                    <TableCell className="tnum hidden text-muted-foreground md:table-cell">{docsSummary(row)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant={row.id === firstRedId ? "default" : "outline"}>
                        <Link href={`/admin/expedientes/${row.id}`} aria-label={`Abrir expediente de ${row.nombre_completo}`}>
                          <span className="sm:hidden">Abrir</span>
                          <span className="hidden sm:inline">Abrir expediente</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPendientes > filas.length && (
              <p className="tnum mt-2 text-xs text-muted-foreground">
                Mostrando {filas.length} de {totalPendientes}.{" "}
                <Link href="/admin/expedientes" className="font-semibold text-foreground underline underline-offset-2">
                  Ver todos los expedientes
                </Link>
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}

AdminHome.layout = adminLayout;
