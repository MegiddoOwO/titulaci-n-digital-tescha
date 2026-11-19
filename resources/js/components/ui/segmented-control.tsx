import * as React from "react";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ElementType;
  /** Shorter visible text below `sm`; the full label stays as the accessible name. */
  short?: string;
}

/**
 * Plain button group for switching a view or filter on the same page (the Inertia visit it may
 * trigger only refreshes props). Each button reports `aria-pressed`, so it is a normal Tab stop
 * operable with Enter and Space; there is no tablist/roving-tabindex contract to maintain.
 * Use links with `aria-current` instead if a choice ever navigates to a different page.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the group. */
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("flex gap-1 rounded-md border bg-card p-0.5", className)}>
      {options.map(({ value: v, label: text, icon: Icon, short }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(v)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded px-3 py-2.5 text-sm sm:py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none",
              active
                ? "bg-secondary font-semibold text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
            {short ? (
              <>
                <span aria-hidden="true" className="sm:hidden">{short}</span>
                <span className="sr-only sm:not-sr-only">{text}</span>
              </>
            ) : (
              text
            )}
          </button>
        );
      })}
    </div>
  );
}
