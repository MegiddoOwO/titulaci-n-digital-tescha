import { LampBadge, type LampState } from "@/components/ui/lamp";

/**
 * Lamp semantics per kind (single definition; DESIGN.md records this rule):
 * - verde: nothing is owed (approved, completed, or no pending items).
 * - ambar: someone has work to do or is waiting (received, in review, in process, pending admin action).
 * - rojo: a rejection or refusal needs attention.
 * - off (unlit): the admin has nothing to act on yet (a document not uploaded) or the item is
 *   closed out of the flow (cancelled, inactive).
 * So "Pendiente" is unlit for a documento (the student owes the upload) and amber for an ARCO request
 * (the admin owes the answer). An invitación "Pendiente" is amber too (the invitee owes the
 * acceptance), "Aceptada" is green (nothing owed) and "Vencida" or "Revocada" are unlit (closed out).
 * "Activo" accounts carry no lamp at all, so a lit lamp never decorates
 * a normal row.
 *
 * The one status vocabulary for every role. A state is always a lamp on a dark housing plus its
 * text label; color is never the only signal. "off" is an unlit lamp (not started, cancelled).
 */
type Tone = LampState | "off" | "none";

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

/** Solicitudes ARCO: pending and in-process work is amber; the two closing states are green and red. */
const ARCO: Record<string, { tone: Tone; label: string }> = {
  pendiente: { tone: "ambar", label: "Pendiente" },
  en_proceso: { tone: "ambar", label: "En proceso" },
  completada: { tone: "verde", label: "Completada" },
  rechazada: { tone: "rojo", label: "Rechazada" },
};

/** Accounts and catalog records: active is lit green, inactive is an unlit lamp. */
const CUENTA: Record<string, { tone: Tone; label: string }> = {
  activo: { tone: "none", label: "Activo" },
  inactivo: { tone: "off", label: "Inactivo" },
};

/** Invitations: waiting on the invitee is amber, accepted is green, expired or revoked is closed out. */
const INVITACION: Record<string, { tone: Tone; label: string }> = {
  pendiente: { tone: "ambar", label: "Pendiente" },
  aceptada: { tone: "verde", label: "Aceptada" },
  expirada: { tone: "off", label: "Vencida" },
  revocada: { tone: "off", label: "Revocada" },
};

const KINDS = { tramite: TRAMITE, documento: DOCUMENTO, arco: ARCO, cuenta: CUENTA, invitacion: INVITACION };

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
  kind: "tramite" | "documento" | "arco" | "cuenta" | "invitacion";
  status: string;
  /**
   * Trámite only: the semáforo computed by the database view for that trámite. When given, it picks
   * the lit lamp (a rejected document anywhere makes it red) while the text keeps naming the status.
   */
  semaforo?: string | null;
  className?: string;
}

export function StatusBadge({ kind, status, semaforo, className }: StatusBadgeProps) {
  const entry = KINDS[kind][status] ?? { tone: "off" as Tone, label: humanize(status) };
  const lit: LampState | null =
    kind === "tramite" && (semaforo === "verde" || semaforo === "ambar" || semaforo === "rojo") ? semaforo : null;
  const lamp = lit && entry.tone !== "off" ? lit : (entry.tone as LampState | "off");

  if (entry.tone === "none") {
    return <span className={`text-xs font-semibold text-muted-foreground ${className ?? ""}`}>{entry.label}</span>;
  }

  return (
    <span className="inline-flex items-center">
      <LampBadge state={lamp} label={entry.label} className={className} />
      {lit && <span className="sr-only">, semáforo {SEMAFORO_NAME[lit]}</span>}
    </span>
  );
}
