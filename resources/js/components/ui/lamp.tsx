import * as React from "react";

import { cn } from "@/lib/utils";

/** Semáforo colors as the database views emit them. */
export type LampState = "verde" | "ambar" | "rojo";

export interface LampCounts {
  rojo: number;
  ambar: number;
  verde: number;
}

export const LAMP_STATES: LampState[] = ["verde", "ambar", "rojo"];

/** Text that always accompanies a lamp: color is never the only signal. */
export const LAMP_LABEL: Record<LampState, string> = {
  verde: "Sin pendientes",
  ambar: "Con pendientes",
  rojo: "Con rechazos",
};

const LAMP_NAME: Record<LampState, string> = { verde: "verde", ambar: "ámbar", rojo: "rojo" };

const lampLit: Record<LampState, string> = {
  verde: "bg-lamp-green",
  ambar: "bg-lamp-amber",
  rojo: "bg-lamp-red",
};

/** Narrow unknown view output to a lamp state (the view is the source of truth; default ámbar). */
export function toLampState(value: string | null | undefined): LampState {
  return value === "verde" || value === "rojo" ? value : "ambar";
}

export function pluralLamp(count: number, state: LampState): string {
  return `${count} ${LAMP_NAME[state]}`;
}

interface LampHousingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** One lit lamp. Ignored when `counts` is given. */
  state?: LampState | null;
  /** Lights every lamp whose count is above zero (a status can hold trámites of several colors). */
  counts?: LampCounts;
  size?: "sm" | "md";
  /** Accessible name. Defaults to a text description of what is lit. */
  label?: string;
}

/**
 * Dark pill housing with three round lamps (verde, ámbar, rojo from top to bottom).
 * Exposed as an image with a text name; pair it with a visible label wherever it is shown.
 */
const LampHousing = React.forwardRef<HTMLDivElement, LampHousingProps>(
  ({ state, counts, size = "md", label, className, ...props }, ref) => {
    const lit = (s: LampState) => (counts ? counts[s] > 0 : state === s);

    const description =
      label ??
      (counts
        ? LAMP_STATES.some(lit)
          ? `Semáforo: ${LAMP_STATES.filter(lit)
              .map((s) => pluralLamp(counts[s], s))
              .join(", ")}`
          : "Semáforo apagado: sin trámites"
        : state
          ? `Semáforo ${LAMP_NAME[state]}: ${LAMP_LABEL[state]}`
          : "Semáforo apagado");

    return (
      <div
        ref={ref}
        role="img"
        aria-label={description}
        className={cn(
          "flex shrink-0 flex-col items-center border bg-lamp-housing",
          size === "md" ? "w-11 gap-1.5 rounded-[22px] p-2" : "w-[18px] gap-[3px] rounded-full p-[3px]",
          className,
        )}
        style={{ borderColor: "hsl(var(--lamp-housing-edge))" }}
        {...props}
      >
        {LAMP_STATES.map((s) => (
          <i
            key={s}
            aria-hidden="true"
            className={cn(
              "block rounded-full",
              size === "md" ? "h-[26px] w-[26px]" : "h-3 w-3",
              lit(s) ? lampLit[s] : "bg-lamp-off",
            )}
          />
        ))}
      </div>
    );
  },
);
LampHousing.displayName = "LampHousing";

/**
 * Compact horizontal pill: one round lamp on a dark housing followed by its text label.
 * For table rows and lists where the full three-lamp housing is too tall.
 */
function LampBadge({
  state,
  label,
  className,
}: {
  state: LampState;
  /** Overrides the default text for the state. */
  label?: string;
  className?: string;
}) {
  const text = label ?? LAMP_LABEL[state];
  const textColor = { verde: "text-state-green", ambar: "text-state-amber", rojo: "text-state-red" }[state];

  return (
    <span className={cn("inline-flex items-center gap-2 text-xs font-semibold", className)}>
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-lamp-housing"
        style={{ boxShadow: "inset 0 0 0 1px hsl(var(--lamp-housing-edge))" }}
      >
        <i className={cn("block h-3 w-3 rounded-full", lampLit[state])} />
      </span>
      <span className={textColor}>{text}</span>
    </span>
  );
}

export { LampHousing, LampBadge };
