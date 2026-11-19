import { formatPercent } from "@/lib/format";
import { useEffect, useRef, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminLayout } from "@/components/admin/AdminLayout";
import { RechazoModal } from "@/components/admin/RechazoModal";
import { ExpedienteDocumentos } from "@/components/admin/ExpedienteDocumentos";
import { reviewDocumento, useExpedienteDetalle } from "@/components/admin/useExpedienteDetalle";
import type { ExpedienteItem } from "@/types/admin";

export default function AdminDocumentos({
  expedientes,
  filters,
}: {
  expedientes: ExpedienteItem[];
  filters: { search: string };
}) {
  const [search, setSearch] = useState(filters.search);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rechazarDocId, setRechazarDocId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const { detalle, loading, refetch } = useExpedienteDetalle(selectedId);

  // Server-side search through the query string (debounced, URL kept in sync).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = window.setTimeout(
      () => router.get("/admin/documentos", search ? { search } : {}, { preserveState: true, preserveScroll: true, replace: true }),
      300,
    );
    return () => window.clearTimeout(t);
  }, [search]);

  const review = (docId: number, action: "aprobar" | "rechazar", data: Record<string, string> = {}) =>
    reviewDocumento(docId, action, data, {
      onStart: () => setPending(true),
      onFinish: () => setPending(false),
      onSuccess: () => {
        if (action === "rechazar") setRechazarDocId(null);
        void refetch();
      },
    });

  const seleccionado = expedientes.find((e) => e.id === selectedId);

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-4 px-4 py-6 sm:px-8">
      <Head title="Documentos" />
      <div>
        <h1 className="text-2xl font-extrabold">Documentos</h1>
        <p className="text-sm text-muted-foreground">Revisa y valida los documentos de cada expediente</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          aria-label="Buscar estudiante"
          placeholder="Buscar estudiante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 sm:max-w-md"
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground" aria-labelledby="exp-lista-titulo">
          <h2 id="exp-lista-titulo" className="border-b px-4 py-3 text-base font-extrabold">
            Expedientes <span className="tnum text-sm font-normal text-muted-foreground">({expedientes.length})</span>
          </h2>
          {expedientes.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-semibold">
                {search.trim() ? "Ningún expediente coincide con tu búsqueda." : "Todavía no hay expedientes para revisar."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search.trim()
                  ? "Prueba con otro nombre o número de control."
                  : "Cuando un estudiante inicie su trámite y suba documentos, su expediente aparecerá aquí."}
              </p>
            </div>
          ) : (
            <ul className="max-h-72 divide-y overflow-y-auto lg:max-h-[640px]">
              {expedientes.map((exp) => (
                <li key={exp.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(exp.id)}
                    aria-pressed={selectedId === exp.id}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60 ${
                      selectedId === exp.id ? "bg-muted" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className={`block truncate text-sm ${selectedId === exp.id ? "font-extrabold" : "font-semibold"}`}>{exp.nombre_completo}</span>
                      <span className="tnum block truncate text-xs text-muted-foreground">
                        {exp.numero_control} · {exp.opcion_titulacion}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-0.5">
                      <StatusBadge kind="tramite" status={exp.estatus} semaforo={exp.color_semaforo} />
                      <span className="tnum text-xs text-muted-foreground">{formatPercent(exp.porcentaje)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 rounded-lg border bg-card p-4 text-card-foreground" aria-labelledby="exp-detalle-titulo">
          <h2 id="exp-detalle-titulo" className="mb-3 text-base font-extrabold">
            {selectedId ? (
              <>
                Documentos del expediente <span className="tnum">#{selectedId}</span>
                {seleccionado && <span className="ml-2 text-sm font-normal text-muted-foreground">{seleccionado.nombre_completo}</span>}
              </>
            ) : (
              "Selecciona un expediente"
            )}
          </h2>
          {!selectedId ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Elige un expediente de la lista para revisar sus documentos: aprobar, rechazar con motivo o abrirlos.
              </p>
            </div>
          ) : (
            <ExpedienteDocumentos
              detalle={detalle}
              loading={loading}
              pending={pending}
              showFormat
              onApprove={(id) => review(id, "aprobar")}
              onReject={setRechazarDocId}
            />
          )}
        </section>
      </div>

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

AdminDocumentos.layout = adminLayout;
