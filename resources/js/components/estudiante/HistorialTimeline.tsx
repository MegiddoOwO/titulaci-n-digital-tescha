import { formatDateTime } from "@/lib/format";
import { Deferred } from "@inertiajs/react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import type { HistorialEntry } from "@/types/tramite";

const MAX_ENTRIES = 10;

function Entries({ historial }: { historial?: HistorialEntry[] }) {
  if (!historial || historial.length === 0) {
    return <p className="px-4 py-5 text-sm text-muted-foreground">Aún no hay movimientos en tu trámite. Aparecerán aquí cuando subas o revisen un documento.</p>;
  }
  return (
    <>
      <ol className="divide-y">
        {historial.slice(0, MAX_ENTRIES).map((entry) => (
          <li key={entry.id} className="grid gap-1 px-4 py-3">
            <StatusBadge kind="documento" status={entry.estado_nuevo} />
            {entry.comentario && <p className="break-words text-sm leading-snug">{entry.comentario}</p>}
            <p className="tnum text-xs text-muted-foreground">
              {formatDateTime(entry.fecha)}
              {entry.usuario_nombre ? ` · ${entry.usuario_nombre}` : ""}
            </p>
          </li>
        ))}
      </ol>
      {historial.length > MAX_ENTRIES && (
        <p className="border-t px-4 py-2.5 text-xs text-muted-foreground">Se muestran los {MAX_ENTRIES} movimientos más recientes.</p>
      )}
    </>
  );
}

function EntriesSkeleton() {
  return (
    <div className="grid gap-3 px-4 py-4" role="status" aria-label="Cargando historial">
      {[0, 1, 2].map((i) => (
        <div key={i} className="grid gap-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Newest-first timeline of the trámite. The `historial` prop is a deferred Inertia prop. */
export function HistorialTimeline({ historial }: { historial?: HistorialEntry[] }) {
  return (
    <section aria-labelledby="historial-titulo" className="overflow-hidden rounded-lg border bg-card">
      <h2 id="historial-titulo" className="border-b px-4 py-3 text-sm font-extrabold">
        Historial de tu trámite
      </h2>
      <Deferred data="historial" fallback={<EntriesSkeleton />}>
        <Entries historial={historial} />
      </Deferred>
    </section>
  );
}
