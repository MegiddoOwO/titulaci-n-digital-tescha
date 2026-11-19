import { cn } from "@/lib/utils";

/**
 * The asesor's load against their limit as one bar. The track spans the limit (or the load when it
 * is above the limit) and the limit is a tick on it; "N de M" is always written out. Without a
 * limit only the count is shown.
 */
export function LoadMeter({ actual, maxima }: { actual: number; maxima: number | null }) {
  const plural = (n: number) => (n === 1 ? "estudiante" : "estudiantes");

  if (maxima === null) {
    return (
      <section className="rounded-lg border bg-card p-3.5 text-card-foreground" aria-labelledby="carga-titulo">
        <h2 id="carga-titulo" className="text-[13px] font-extrabold leading-tight">Mi carga</h2>
        <p className="tnum mt-1 text-[30px] font-extrabold leading-none">{actual}</p>
        <p className="mt-2.5 text-xs text-muted-foreground">Sin límite de estudiantes configurado.</p>
      </section>
    );
  }

  const scale = Math.max(actual, maxima, 1);
  const over = actual > maxima;
  const full = actual === maxima;
  const libres = maxima - actual;
  const caption = over
    ? `Superas tu límite por ${actual - maxima} ${plural(actual - maxima)}.`
    : full
      ? "Alcanzaste tu límite: no recibirás más asignaciones."
      : `Puedes recibir ${libres} ${plural(libres)} más.`;

  return (
    <section className="rounded-lg border bg-card p-3.5 text-card-foreground" aria-labelledby="carga-titulo">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="carga-titulo" className="text-[13px] font-extrabold leading-tight">Mi carga</h2>
        <p className="tnum text-[30px] font-extrabold leading-none">
          {actual} <span className="text-sm font-semibold text-muted-foreground">de {maxima}</span>
        </p>
      </div>

      <div className="relative mt-3 pb-4">
        <div
          role="meter"
          aria-label="Carga de estudiantes"
          aria-valuemin={0}
          aria-valuemax={maxima}
          aria-valuenow={actual}
          aria-valuetext={`${actual} de ${maxima} estudiantes`}
          className="h-2.5 overflow-hidden rounded-full bg-secondary"
        >
          <div
            className={cn("h-full rounded-full", over ? "bg-lamp-red" : "bg-primary")}
            style={{ width: `${(actual / scale) * 100}%` }}
          />
        </div>
        <span
          aria-hidden="true"
          className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-foreground"
          style={{ left: `calc(${(maxima / scale) * 100}% - 1px)` }}
        />
        <span
          aria-hidden="true"
          className="tnum absolute top-[18px] whitespace-nowrap text-[11px] leading-none text-muted-foreground"
          style={{ left: `${(maxima / scale) * 100}%`, transform: "translateX(-100%)" }}
        >
          Límite {maxima}
        </span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </section>
  );
}
