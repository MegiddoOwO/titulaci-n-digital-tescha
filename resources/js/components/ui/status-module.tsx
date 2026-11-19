import * as React from "react";

import { cn } from "@/lib/utils";
import { LampHousing, pluralLamp, LAMP_STATES, type LampCounts, type LampState } from "@/components/ui/lamp";

interface StatusModuleProps extends React.HTMLAttributes<HTMLElement> {
  /** Status name, e.g. "En proceso". */
  name: string;
  total: number;
  counts: LampCounts;
  /** Noun counted by the total, read by screen readers. Defaults to trámite(s). */
  unit?: { one: string; many: string };
}

const COUNT_COLS: { key: keyof LampCounts; label: string }[] = [
  { key: "rojo", label: "rojo" },
  { key: "ambar", label: "ámbar" },
  { key: "verde", label: "verde" },
];

/**
 * One status of the board. From `sm` up: lamp housing at the left; name, total and the
 * red/amber/green counts at the right. Below `sm`: a compact row (small housing, name with the
 * counts written inline, total at the right) so the five statuses fit in about one viewport.
 * Every count is written out, so the lamps are redundant, never the only signal.
 */
function StatusModule({ name, total, counts, unit = { one: "trámite", many: "trámites" }, className, ...props }: StatusModuleProps) {
  return (
    <>
      <section
        className={cn("flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-card-foreground sm:hidden", className)}
        {...props}
      >
        <LampHousing counts={counts} size="sm" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] font-extrabold leading-tight">{name}</h2>
          <p className="tnum mt-0.5 text-xs leading-tight text-muted-foreground">
            {LAMP_STATES.slice()
              .reverse()
              .map((s) => pluralLamp(counts[s], s))
              .join(" · ")}
          </p>
        </div>
        <p className="tnum text-[26px] font-extrabold leading-none">
          {total}
          <span className="sr-only"> {total === 1 ? unit.one : unit.many}</span>
        </p>
      </section>

      <section
        className={cn(
          "hidden grid-cols-[44px_1fr] gap-3 rounded-lg border bg-card p-3.5 text-card-foreground sm:grid",
          className,
        )}
        {...props}
      >
        <LampHousing counts={counts} />
        <div className="min-w-0">
          <h2 className="text-[13px] font-extrabold leading-tight">{name}</h2>
          <p className="tnum mt-1 text-[30px] font-extrabold leading-none">
            {total}
            <span className="sr-only"> {total === 1 ? unit.one : unit.many}</span>
          </p>
          <dl className="mt-2.5 grid grid-cols-3 gap-1">
            {COUNT_COLS.map(({ key, label }) => (
              <div key={key} className="flex flex-col-reverse">
                <dt className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</dt>
                <dd className="tnum text-sm font-extrabold leading-none">{counts[key]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}

interface CountModuleProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  total: number;
  /** The one lit lamp: amber when work is owed, red for rejections, green when nothing is owed. */
  state: LampState;
  /** Written explanation of the lamp, so color is never the only signal. */
  caption: string;
  /** Noun counted by the total, read by screen readers. */
  unit: { one: string; many: string };
}

/**
 * A single count with one lit lamp and a written caption: the sibling of StatusModule for numbers
 * that are not split by semáforo (documents to review, trámites with rejections). Same two layouts.
 */
function CountModule({ name, total, state, caption, unit, className, ...props }: CountModuleProps) {
  const sr = <span className="sr-only"> {total === 1 ? unit.one : unit.many}</span>;
  return (
    <>
      <section
        className={cn("flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 text-card-foreground sm:hidden", className)}
        {...props}
      >
        <LampHousing state={state} size="sm" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] font-extrabold leading-tight">{name}</h2>
          <p className="mt-0.5 text-xs leading-tight text-muted-foreground">{caption}</p>
        </div>
        <p className="tnum text-[26px] font-extrabold leading-none">
          {total}
          {sr}
        </p>
      </section>

      <section
        className={cn(
          "hidden grid-cols-[44px_1fr] gap-3 rounded-lg border bg-card p-3.5 text-card-foreground sm:grid",
          className,
        )}
        {...props}
      >
        <LampHousing state={state} />
        <div className="min-w-0">
          <h2 className="text-[13px] font-extrabold leading-tight">{name}</h2>
          <p className="tnum mt-1 text-[30px] font-extrabold leading-none">
            {total}
            {sr}
          </p>
          <p className="mt-2.5 text-xs leading-snug text-muted-foreground">{caption}</p>
        </div>
      </section>
    </>
  );
}

export { StatusModule, CountModule };
