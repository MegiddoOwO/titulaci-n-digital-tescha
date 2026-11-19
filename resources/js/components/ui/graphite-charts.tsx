import * as React from "react";
import { BarChart, Bar, LabelList, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, Table2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ChartDatum {
  /** Axis label. */
  name: string;
  value: number;
  /** Abbreviated axis label used below the `sm` breakpoint. */
  short?: string;
  /** Longer label for the tooltip and the table (defaults to `name`). */
  detail?: string;
}

interface GraphiteChartProps {
  title: string;
  data: ChartDatum[];
  /** What `value` counts, e.g. "Trámites". Shown in the tooltip, the table head and the accessible name. */
  valueLabel: string;
  /** Header of the first table column, e.g. "Estatus". */
  categoryLabel: string;
  height?: number;
  /** Shown under the chart when every value is zero. */
  emptyNote?: string;
  className?: string;
}

/** True below the `sm` breakpoint (640px). */
function useNarrow(): boolean {
  const [narrow, setNarrow] = React.useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

const AXIS_TICK = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

/** Integer ticks from 0 for count axes: never 0.5 or 1.5 of a trámite. */
function integerTicks(max: number): number[] {
  const top = Math.max(1, Math.ceil(max));
  const step = Math.ceil(top / 4);
  const ticks: number[] = [];
  for (let v = 0; v < top + step; v += step) {
    ticks.push(v);
    if (v >= top) break;
  }
  return ticks;
}

function ChartTooltip({
  active,
  payload,
  valueLabel,
}: {
  active?: boolean;
  payload?: { value?: number; payload?: ChartDatum }[];
  valueLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const datum = item.payload;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md">
      <p className="font-semibold">{datum?.detail ?? datum?.name}</p>
      <p className="tnum text-muted-foreground">
        {valueLabel}: <span className="font-extrabold text-foreground">{item.value}</span>
      </p>
    </div>
  );
}

/** Card with a title, the chart, and a switch to an equivalent data table. */
function ChartFrame({
  title,
  data,
  valueLabel,
  categoryLabel,
  emptyNote,
  className,
  children,
}: GraphiteChartProps & { children: React.ReactNode }) {
  const [asTable, setAsTable] = React.useState(false);
  const allZero = data.every((d) => d.value === 0);

  return (
    <figure className={cn("min-w-0 rounded-lg border bg-card px-4 py-3.5 text-card-foreground", className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <figcaption className="text-[13px] font-extrabold">{title}</figcaption>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
          aria-pressed={asTable}
          onClick={() => setAsTable((v) => !v)}
        >
          {asTable ? <BarChart3 aria-hidden="true" /> : <Table2 aria-hidden="true" />}
          {asTable ? "Ver gráfica" : "Ver tabla"}
        </Button>
      </div>

      {allZero && emptyNote && !asTable ? (
        <p className="py-4 text-sm text-muted-foreground">{emptyNote}</p>
      ) : asTable ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{categoryLabel}</TableHead>
              <TableHead className="text-right">{valueLabel}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.name + (d.detail ?? "")}>
                <TableCell>{d.detail ?? d.name}</TableCell>
                <TableCell className="tnum text-right font-semibold">{d.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div role="img" aria-label={`${title}. ${data.map((d) => `${d.detail ?? d.name}: ${d.value}`).join("; ")}.`}>
          {children}
        </div>
      )}

    </figure>
  );
}

/** Single-hue graphite bars with 4px rounded ends, a recessive grid and an integer count axis. */
function GraphiteBarChart(props: GraphiteChartProps) {
  const { data, valueLabel, height = 220 } = props;
  const narrow = useNarrow();
  const ticks = integerTicks(Math.max(0, ...data.map((d) => d.value)));
  const plotted = data.map((d) => ({ ...d, axis: narrow && d.short ? d.short : d.name, detail: d.detail ?? d.name }));

  return (
    <ChartFrame {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={plotted} margin={{ top: 18, right: 8, bottom: 0, left: -18 }} barCategoryGap="12%">
          <CartesianGrid vertical={false} stroke="hsl(var(--chart-grid))" />
          <XAxis dataKey="axis" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} interval={0} />
          <YAxis
            allowDecimals={false}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltip valueLabel={valueLabel} />} />
          <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
            <LabelList dataKey="value" position="top" className="tnum" fontSize={11} fontWeight={600} fill="hsl(var(--foreground))" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Single-hue graphite line (2px) over a recessive grid with an integer count axis. */
function GraphiteLineChart(props: GraphiteChartProps) {
  const { data, valueLabel, height = 220 } = props;
  const ticks = integerTicks(Math.max(0, ...data.map((d) => d.value)));

  return (
    <ChartFrame {...props}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 14, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--chart-grid))" />
          <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} interval="preserveStartEnd" />
          <YAxis
            allowDecimals={false}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip cursor={{ stroke: "hsl(var(--border))" }} content={<ChartTooltip valueLabel={valueLabel} />} />
          <Line
            type="linear"
            dataKey="value"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--card))", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export { GraphiteBarChart, GraphiteLineChart, integerTicks };
