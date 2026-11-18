import { LampBadge, type LampState } from "@/components/ui/lamp";

/**
 * The one status vocabulary for every role. A state is always a lamp on a dark housing plus its
 * text label; color is never the only signal. "off" is an unlit lamp (not started, cancelled).
 */
type Tone = LampState | "off";

const TRAMITE: Record<string, { tone: Tone; label: string }> = {
  en_proceso: { tone: "ambar", label: "En proceso" },
  en_revision: { tone: "ambar", label: "En revisión" },
  aprobado: { tone: "verde", label: "Aprobado" },
  rechazado: { tone: "rojo", label: "Rechazado" },
  completado: { tone: "verde", label: "Completado" },
  cancelado: { tone: "off", label: "Cancelado" },
};

const DOCUMENTO: Record<string, { tone: Tone; label: string }> = {
  pendiente: { tone: "off", label: "Pendiente" },
  cargado: { tone: "ambar", label: "Recibido" },
  en_revision: { tone: "ambar", label: "En revisión" },
  aprobado: { tone: "verde", label: "Aprobado" },
  rechazado: { tone: "rojo", label: "Rechazado" },
};

const SEMAFORO_NAME: Record<LampState, string> = { verde: "verde", ambar: "ámbar", rojo: "rojo" };

function humanize(status: string) {
  const text = status.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Text label of a trámite or document status, for places that cannot render the badge. */
export function estatusLabel(kind: "tramite" | "documento", status: string): string {
  return (kind === "tramite" ? TRAMITE : DOCUMENTO)[status]?.label ?? humanize(status);
}

interface StatusBadgeProps {
  kind: "tramite" | "documento";
  status: string;
  /**
   * Trámite only: the semáforo computed by the database view for that trámite. When given, it picks
   * the lit lamp (a rejected document anywhere makes it red) while the text keeps naming the status.
   */
  semaforo?: string | null;
  className?: string;
}

export function StatusBadge({ kind, status, semaforo, className }: StatusBadgeProps) {
  const entry = (kind === "tramite" ? TRAMITE : DOCUMENTO)[status] ?? { tone: "off" as Tone, label: humanize(status) };
  const lit: LampState | null =
    kind === "tramite" && (semaforo === "verde" || semaforo === "ambar" || semaforo === "rojo") ? semaforo : null;
  const lamp: Tone = lit && entry.tone !== "off" ? lit : entry.tone;

  return (
    <span className="inline-flex items-center">
      <LampBadge state={lamp} label={entry.label} className={className} />
      {lit && <span className="sr-only">, semáforo {SEMAFORO_NAME[lit]}</span>}
    </span>
  );
}
