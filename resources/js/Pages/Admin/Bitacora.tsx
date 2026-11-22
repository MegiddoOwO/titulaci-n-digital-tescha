import { formatDateTime } from "@/lib/format";
import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminLayout } from "@/components/admin/AdminLayout";

interface BitacoraEntry {
  id: number;
  accion: string;
  entidad: string;
  entidad_id: number;
  /** Decoded server-side (the column is JSON). */
  detalle: unknown;
  ip_origen: string | null;
  fecha: string;
  usuario_nombre: string | null;
}

interface Props {
  rows: BitacoraEntry[];
  total: number;
  page: number;
  totalPages: number;
}

/** DB table names as readable singular labels; unknown names are humanized. */
const ENTIDAD: Record<string, string> = {
  documentos: "Documento",
  tramites: "Trámite",
  usuarios: "Usuario",
  dictamenes: "Dictamen",
  solicitudes_arco: "Solicitud ARCO",
  notificaciones: "Notificación",
  asignaciones: "Asignación",
};

const entidadLabel = (entidad: string) => {
  const known = ENTIDAD[entidad];
  if (known) return known;
  const text = entidad.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const MAX_DETALLE = 200;

/** Decoded payload as key/value pairs, cut once the text reaches 200 characters (as before). */
function detallePairs(detalle: unknown): { key: string | null; value: string }[] {
  let data: unknown = detalle;
  if (typeof detalle === "string") {
    try {
      data = JSON.parse(detalle);
    } catch {
      return [{ key: null, value: detalle.substring(0, MAX_DETALLE) }];
    }
  }
  const entries: [string | null, unknown][] =
    data !== null && typeof data === "object" && !Array.isArray(data)
      ? Object.entries(data as Record<string, unknown>)
      : [[null, data]];
  const pairs: { key: string | null; value: string }[] = [];
  let used = 0;
  for (const [key, raw] of entries) {
    if (used >= MAX_DETALLE) break;
    const value = typeof raw === "string" ? raw : JSON.stringify(raw);
    const room = MAX_DETALLE - used;
    const cut = value.length > room - (key?.length ?? 0) - 2 ? value.substring(0, Math.max(room - (key?.length ?? 0) - 2, 1)) : value;
    pairs.push({ key, value: cut });
    used += (key?.length ?? 0) + 2 + cut.length;
  }
  return pairs;
}

/** Words never split mid-token (a date or matrícula stays whole); only very long tokens may break. */
function Valor({ text }: { text: string }) {
  return (
    <span className="font-mono">
      {text.split(" ").map((token, i) => (
        <span key={i} className={token.length > 36 ? "[overflow-wrap:anywhere]" : "whitespace-nowrap"}>
          {i > 0 ? " " : ""}
          {token}
        </span>
      ))}
    </span>
  );
}


export default function AdminBitacora({ rows, total, page, totalPages }: Props) {
  const [loading, setLoading] = useState(false);

  // Server-side pagination through the query string (20 per page, as the legacy page requested).
  const goTo = (next: number) =>
    router.get("/admin/bitacora", next > 1 ? { page: next } : {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onStart: () => setLoading(true),
      onFinish: () => setLoading(false),
    });

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-4 px-4 py-6 sm:px-8">
      <Head title="Bitácora" />
      <div>
        <h1 className="text-2xl font-extrabold">Bitácora</h1>
        <p className="tnum text-sm text-muted-foreground">Registro de auditoría del sistema · {total} {total === 1 ? "registro" : "registros"}</p>
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground" aria-label="Registros de auditoría">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando registros...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <History className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">No hay registros en la bitácora.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Las acciones de usuarios y del sistema, como emitir dictámenes o revisar documentos, quedan registradas aquí.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {rows.map((entry) => (
              <li key={entry.id} className="px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <p className="text-sm font-semibold">
                    {entry.accion}
                    <span className="tnum ml-2 text-xs font-normal text-muted-foreground">
                      {entidadLabel(entry.entidad)}
                      {entry.entidad_id ? ` #${entry.entidad_id}` : ""}
                    </span>
                  </p>
                  <p className="tnum text-xs text-muted-foreground">{formatDateTime(entry.fecha)}</p>
                </div>
                {entry.detalle != null && (
                  <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                    {detallePairs(entry.detalle).map((p, i) => (
                      <div key={i} className="min-w-0">
                        {p.key !== null && <dt className="inline text-muted-foreground">{p.key}: </dt>}
                        <dd className="inline"><Valor text={p.value} /></dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p className="tnum mt-1 text-xs text-muted-foreground">
                  {entry.usuario_nombre || "Sistema"}
                  {entry.ip_origen ? ` · IP: ${entry.ip_origen}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Paginación">
          <span className="tnum text-xs text-muted-foreground">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => goTo(page - 1)}>Anterior</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => goTo(page + 1)}>Siguiente</Button>
          </div>
        </nav>
      )}
    </div>
  );
}

AdminBitacora.layout = adminLayout;
