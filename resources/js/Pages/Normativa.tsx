import { useEffect, useMemo, useState } from "react";
import { Head, router } from "@inertiajs/react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PublicShell from "@/components/layout/PublicShell";
import { NormaTexto } from "@/components/public/NormaTexto";
import { cn } from "@/lib/utils";

interface NormativaItem {
  id: number;
  titulo: string;
  contenido: string;
  categoria: string | null;
  modalidad_id: number | null;
  modalidad_nombre: string | null;
  orden: number;
}

interface Props {
  normativa: NormativaItem[];
  modalidadId: number | null;
}

const hashId = () => {
  if (typeof window === "undefined") return null;
  const m = window.location.hash.match(/^#norma-(\d+)$/);
  return m ? Number(m[1]) : null;
};

const Normativa = ({ normativa, modalidadId: activeModalidad }: Props) => {
  const modalidadId = activeModalidad ? String(activeModalidad) : "todas";
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(hashId);
  const [indexOpen, setIndexOpen] = useState(false);

  // The filter is a server-side query: each change is an Inertia visit (state and scroll kept).
  const setModalidadId = (value: string) => {
    router.get(
      "/normativa",
      value !== "todas" ? { modalidad_id: value } : {},
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        only: ["normativa", "modalidadId"],
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      },
    );
  };

  // Fall back to the first norma when none is picked or the filter removed the picked one.
  const index = useMemo(() => {
    const i = normativa.findIndex((n) => n.id === selected);
    return i >= 0 ? i : 0;
  }, [normativa, selected]);
  const current: NormativaItem | undefined = normativa[index];
  const prev = normativa[index - 1];
  const next = normativa[index + 1];

  const pick = (id: number) => {
    setSelected(id);
    setIndexOpen(false);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#norma-${id}`);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onHash = () => setSelected(hashId());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const filter = (
    <div className="space-y-1.5">
      <Label htmlFor="filtro-modalidad" className="text-sm">
        Modalidad
      </Label>
      <Select value={modalidadId} onValueChange={setModalidadId}>
        <SelectTrigger id="filtro-modalidad" className="h-11 w-full bg-card md:h-10">
          <SelectValue placeholder="Filtrar por modalidad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las modalidades</SelectItem>
          <SelectItem value="1">Tesis</SelectItem>
          <SelectItem value="2">Residencias Profesionales</SelectItem>
          <SelectItem value="3">Excelencia Académica</SelectItem>
          <SelectItem value="4">EGEL-CENEVAL</SelectItem>
          <SelectItem value="5">Créditos de Posgrado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const list = (
    <ol className="space-y-0.5">
      {normativa.map((n) => {
        const active = n.id === current?.id;
        return (
          <li key={n.id}>
            <a
              href={`#norma-${n.id}`}
              onClick={(e) => {
                e.preventDefault();
                pick(n.id);
              }}
              aria-current={active ? "true" : undefined}
              className={cn(
                "block rounded-md px-3 py-2.5 text-sm leading-snug transition-colors hover:bg-muted",
                active ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {n.titulo}
              {n.modalidad_nombre && <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{n.modalidad_nombre}</span>}
            </a>
          </li>
        );
      })}
    </ol>
  );

  return (
    <PublicShell widthClass="max-w-6xl">
      <Head title="Normativa de Titulación" />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Normativa de Titulación</h1>
        <p className="mt-2 max-w-[60ch] text-base text-muted-foreground">Lineamientos y reglamentos oficiales del proceso de titulación ISC.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-14">
          {/* Contents: collapsed on phones, a quiet sticky list on desktop. */}
          <nav aria-label="Normas" className="lg:sticky lg:top-6 lg:self-start">
            <div className="hidden space-y-5 lg:block">
              {filter}
              {list}
            </div>
            <div className="space-y-4 lg:hidden">
              {filter}
              {current && (
                <div className="rounded-[10px] border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setIndexOpen(!indexOpen)}
                    aria-expanded={indexOpen}
                    aria-controls="indice-normas"
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-left text-sm font-semibold"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-normal text-muted-foreground">
                        <span className="tnum">{normativa.length}</span> normas
                      </span>
                      <span className="block truncate">{current.titulo}</span>
                    </span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", indexOpen && "rotate-180")} aria-hidden="true" />
                  </button>
                  {indexOpen && (
                    <div id="indice-normas" className="border-t border-border p-1.5">
                      {list}
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>

          <article className="min-w-0" aria-live="polite" aria-busy={loading}>
            {loading ? (
              <p className="py-12 text-muted-foreground">Cargando normativa...</p>
            ) : !current ? (
              <p className="py-12 text-muted-foreground">No hay normas publicadas para esta modalidad.</p>
            ) : (
              <>
                <h2 className="max-w-[28ch] text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">{current.titulo}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {[current.categoria, current.modalidad_nombre ?? "Aplica a todas las modalidades"].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-6 border-t border-border pt-6">
                  <NormaTexto contenido={current.contenido} repeatedHeadings={[current.titulo, current.categoria]} />
                </div>

                {(prev || next) && (
                  <div className="mt-10 grid max-w-[65ch] gap-3 border-t border-border pt-6 sm:grid-cols-2">
                    {prev ? (
                      <a
                        href={`#norma-${prev.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          pick(prev.id);
                        }}
                        className="group flex min-h-11 items-center gap-2 rounded-md py-1 text-sm hover:text-foreground"
                      >
                        <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span>
                          <span className="block text-xs text-muted-foreground">Anterior</span>
                          <span className="font-semibold underline-offset-4 group-hover:underline">{prev.titulo}</span>
                        </span>
                      </a>
                    ) : (
                      <span />
                    )}
                    {next && (
                      <a
                        href={`#norma-${next.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          pick(next.id);
                        }}
                        className="group flex min-h-11 items-center justify-end gap-2 rounded-md py-1 text-right text-sm hover:text-foreground"
                      >
                        <span>
                          <span className="block text-xs text-muted-foreground">Siguiente</span>
                          <span className="font-semibold underline-offset-4 group-hover:underline">{next.titulo}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
              </>
            )}
          </article>
        </div>
      </div>
    </PublicShell>
  );
};

export default Normativa;
