import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LampBadge } from "@/components/ui/lamp";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HttpError, postForm } from "@/lib/http";
import { downloadText, toCsv } from "./csv";

type Step = "archivo" | "revision" | "resultado";

interface RowError {
  linea: number;
  campo: string;
  mensaje: string;
}

interface ValidRow {
  linea: number;
  numero_control: string;
  correo: string;
  nombre: string;
  rol: string;
}

interface ValidationSummary {
  total: number;
  validas: number;
  con_error: number;
  errores: RowError[];
  filas_validas: ValidRow[];
}

interface CreatedRow {
  numero_control: string;
  correo: string;
  correo_estado: string;
  link: string | null;
}

interface CreateResponse {
  creadas: number;
  omitidas: number;
  resultados: CreatedRow[];
  errores: RowError[];
}

const ROL_LABEL: Record<string, string> = { estudiante: "Estudiante", asesor: "Asesor", administrativo: "Administrativo" };
const STEPS: { id: Step; label: string }[] = [
  { id: "archivo", label: "Archivo" },
  { id: "revision", label: "Revisión" },
  { id: "resultado", label: "Resultado" },
];
const MAX_ERROR_ROWS = 50;
const MAX_PREVIEW_ROWS = 10;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Friendly Spanish text for every way the upload can fail; never a raw browser or framework page. */
function describeError(e: unknown): string {
  if (e instanceof HttpError) {
    const errors = e.data.errors as Record<string, string[]> | undefined;
    const first = errors ? Object.values(errors).flat()[0] : undefined;
    if (e.status === 422) return first ?? (typeof e.data.message === "string" ? e.data.message : "No se pudo procesar el archivo.");
    if (e.status === 429) return "Demasiados intentos seguidos. Espera un minuto e inténtalo de nuevo.";
    if (e.status === 413) return "El archivo es demasiado grande para el servidor. El máximo es 2 MB.";
    if (e.status === 419) return "Tu sesión expiró. Recarga la página e inicia sesión de nuevo.";
    if (e.status === 401 || e.status === 403) return "No tienes permiso para esta acción. Recarga la página.";
    return "El servidor no pudo procesar el archivo. Inténtalo de nuevo en unos minutos.";
  }
  return "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
}

function ErrorTable({ errores, label }: { errores: RowError[]; label: string }) {
  const shown = errores.slice(0, MAX_ERROR_ROWS);
  const more = errores.length - shown.length;

  return (
    <div className="min-w-0 space-y-1.5">
      <div className="max-h-56 overflow-auto rounded-md border bg-card">
        <Table aria-label={label}>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-10 w-16 px-3">Línea</TableHead>
              <TableHead className="h-10 px-3">Campo</TableHead>
              <TableHead className="h-10 px-3">Mensaje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((e, i) => (
              <TableRow key={`${e.linea}-${e.campo}-${i}`}>
                <TableCell className="tnum px-3 py-2 align-top text-xs">{e.linea}</TableCell>
                <TableCell className="px-3 py-2 align-top text-xs font-semibold">{e.campo}</TableCell>
                <TableCell className="px-3 py-2 align-top text-xs">{e.mensaje}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {more > 0 && <p className="tnum text-xs text-muted-foreground">y {more} más. Descarga el CSV para verlos todos.</p>}
    </div>
  );
}

interface Props {
  open: boolean;
  maxRows: number;
  expireHours: number;
  /** Called once when the dialog closes; `created` tells the page to reload its list. */
  onClose: (created: boolean) => void;
}

export function BulkInvitationsDialog({ open, maxRows, expireHours, onClose }: Props) {
  const [step, setStep] = useState<Step>("archivo");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"validando" | "creando" | null>(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [omit, setOmit] = useState(false);
  // Plain links live only here (rows already delivered by mail are stripped); closing the dialog clears them.
  const [result, setResult] = useState<CreateResponse | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (open) heading.current?.focus();
  }, [step, open]);

  const reset = () => {
    setStep("archivo");
    setFile(null);
    setBusy(null);
    setError("");
    setSummary(null);
    setOmit(false);
    setResult(null);
    setDownloaded(false);
    setConfirmClose(false);
  };

  const finish = () => {
    const created = (result?.creadas ?? 0) > 0;
    reset();
    onClose(created);
  };

  const pending = (result?.resultados ?? []).filter((r) => r.correo_estado !== "enviado" && r.link);
  const needsDownload = pending.length > 0 && !downloaded;

  // Links are never shown again, so leaving the result step without downloading asks exactly once.
  const requestClose = () => {
    if (busy) return;
    if (step === "resultado" && needsDownload && !confirmClose) {
      setConfirmClose(true);
      return;
    }
    finish();
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!next) return;
    setFile(next);
    setError("");
  };

  const review = async () => {
    if (!file || busy) return;
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setError("Formato no admitido. Sube un archivo .xlsx o .csv.");
      return;
    }
    setBusy("validando");
    setError("");
    try {
      const form = new FormData();
      form.append("archivo", file);
      setSummary(await postForm<ValidationSummary>("/admin/invitaciones/masiva/validar", form));
      setOmit(false);
      setStep("revision");
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(null);
    }
  };

  const create = async () => {
    if (!file || !summary || busy) return;
    setBusy("creando");
    setError("");
    try {
      const form = new FormData();
      form.append("archivo", file);
      form.append("omitir_errores", summary.con_error > 0 ? "1" : "0");
      const data = await postForm<CreateResponse>("/admin/invitaciones/masiva/crear", form);
      setResult({
        ...data,
        resultados: data.resultados.map((r) => ({ ...r, link: r.correo_estado === "enviado" ? null : r.link })),
      });
      setDownloaded(false);
      setConfirmClose(false);
      setStep("resultado");
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(null);
    }
  };

  const downloadErrors = (errores: RowError[], name: string) =>
    downloadText(name, toCsv(["linea", "campo", "mensaje"], errores.map((e) => [e.linea, e.campo, e.mensaje])));

  const downloadLinks = () => {
    downloadText("enlaces-invitaciones.csv", toCsv(["numero_control", "correo", "enlace"], pending.map((r) => [r.numero_control, r.correo, r.link])));
    setDownloaded(true);
    setConfirmClose(false);
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const mails = (result?.resultados ?? []).reduce(
    (acc, r) => {
      if (r.correo_estado === "enviado") acc.enviadas++;
      else if (r.correo_estado === "no_configurado") acc.sinCorreo++;
      else acc.fallidas++;
      return acc;
    },
    { enviadas: 0, fallidas: 0, sinCorreo: 0 },
  );

  const mustAcknowledge = (summary?.con_error ?? 0) > 0;
  const canCreate = !!summary && summary.validas > 0 && (!mustAcknowledge || omit);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        onInteractOutside={(e) => { if (busy || step === "resultado") e.preventDefault(); }}
        onEscapeKeyDown={(e) => {
          if (busy) {
            e.preventDefault();
          } else if (step === "resultado") {
            // Same as the single-link dialog: downloaded -> close; not downloaded -> ask; asking -> go back.
            e.preventDefault();
            if (needsDownload) setConfirmClose((asking) => !asking);
            else finish();
          }
        }}
        onOpenAutoFocus={(e) => { e.preventDefault(); heading.current?.focus(); }}
      >
        <DialogHeader>
          <DialogTitle>Carga masiva de invitaciones</DialogTitle>
          <DialogDescription className="sr-only">Crea varias invitaciones a la vez desde un archivo Excel o CSV.</DialogDescription>
        </DialogHeader>

        <ol className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Pasos">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              aria-current={i === stepIndex ? "step" : undefined}
              className={`flex items-center gap-1.5 ${i === stepIndex ? "font-extrabold text-foreground" : "font-medium text-muted-foreground"}`}
            >
              <span
                aria-hidden="true"
                className={`tnum flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${i === stepIndex ? "bg-primary text-primary-foreground" : "border border-input"}`}
              >
                {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s.label}
              {i < stepIndex && <span className="sr-only"> (completado)</span>}
              {i === stepIndex && <span className="sr-only"> (paso actual)</span>}
            </li>
          ))}
        </ol>

        {step === "archivo" && (
          <div className="min-w-0 space-y-4">
            <h3 ref={heading} tabIndex={-1} className="text-sm font-extrabold outline-none">Paso 1: elige el archivo</h3>
            <p className="text-sm text-muted-foreground">Crea varias invitaciones a la vez. El archivo se revisa completo antes de crear nada.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="outline" className="h-11 gap-2 sm:h-10">
                <a href="/admin/invitaciones/plantilla.xlsx" download><Download aria-hidden="true" /> Descargar plantilla Excel (.xlsx)</a>
              </Button>
              <Button asChild variant="outline" className="h-11 gap-2 sm:h-10">
                <a href="/admin/invitaciones/plantilla.csv" download><Download aria-hidden="true" /> Descargar plantilla CSV</a>
              </Button>
            </div>
            <p className="tnum text-xs text-muted-foreground">Hasta {maxRows} filas por archivo, 2 MB como máximo. Formatos: .xlsx y .csv.</p>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold">Archivo de invitaciones</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id="bulk-file"
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={pickFile}
                  aria-describedby="bulk-file-name bulk-file-hint"
                  className="peer sr-only"
                />
                <label
                  htmlFor="bulk-file"
                  className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 sm:h-10"
                >
                  <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Elegir archivo
                </label>
                <span id="bulk-file-name" className="min-w-0 break-all text-sm">
                  {file ? <><span className="font-semibold">{file.name}</span> <span className="tnum text-xs text-muted-foreground">({Math.max(1, Math.round(file.size / 1024))} KB)</span></> : <span className="text-muted-foreground">Ningún archivo elegido</span>}
                </span>
              </div>
              <p id="bulk-file-hint" className="sr-only">Acepta archivos .xlsx o .csv de hasta 2 MB.</p>
            </div>

            {error && (
              <p role="alert" className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            <Button
              type="button"
              onClick={review}
              disabled={!file}
              aria-disabled={busy ? true : undefined}
              aria-busy={busy === "validando" ? true : undefined}
              className="h-11 w-full gap-2 sm:h-10 sm:w-auto"
            >
              {busy === "validando" && <Loader2 className="animate-spin" aria-hidden="true" />}
              {busy === "validando" ? "Revisando archivo…" : "Revisar archivo"}
            </Button>
            <p role="status" aria-live="polite" className="sr-only">{busy === "validando" ? "Revisando archivo…" : ""}</p>
          </div>
        )}

        {step === "revision" && summary && (
          <div className="min-w-0 space-y-4" aria-busy={busy === "creando" ? true : undefined}>
            <h3 ref={heading} tabIndex={-1} className="text-sm font-extrabold outline-none">Paso 2: revisa antes de crear</h3>
            <p className="tnum text-sm text-muted-foreground">
              Se leyeron {plural(summary.total, "fila", "filas")} de <span className="break-all font-semibold text-foreground">{file?.name}</span>. Todavía no se creó nada.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <p className="tnum text-2xl font-extrabold leading-none">{summary.validas}</p>
                <p className="mt-1.5 text-xs font-semibold">Filas válidas</p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <p className="tnum text-2xl font-extrabold leading-none">{summary.con_error}</p>
                <div className="mt-1.5">
                  <LampBadge state={summary.con_error > 0 ? "rojo" : "off"} label="Filas con error" />
                </div>
              </div>
            </div>

            {summary.con_error > 0 && (
              <section className="min-w-0 space-y-2" aria-label="Errores del archivo">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold">Errores por corregir</h4>
                  <Button type="button" variant="outline" size="sm" className="h-11 gap-2 sm:h-9" onClick={() => downloadErrors(summary.errores, "errores-invitaciones.csv")}>
                    <Download aria-hidden="true" /> Descargar errores (CSV)
                  </Button>
                </div>
                <ErrorTable errores={summary.errores} label="Errores del archivo" />
              </section>
            )}

            {summary.validas > 0 ? (
              <section className="min-w-0 space-y-1.5" aria-label="Vista previa de filas válidas">
                <h4 className="text-xs font-extrabold">Vista previa de filas válidas</h4>
                <div className="overflow-hidden rounded-md border bg-card">
                  <Table aria-label="Vista previa de filas válidas">
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="h-10 px-3">Matrícula</TableHead>
                        <TableHead className="h-10 px-3">Nombre</TableHead>
                        <TableHead className="h-10 px-3">Rol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.filas_validas.slice(0, MAX_PREVIEW_ROWS).map((r) => (
                        <TableRow key={r.linea}>
                          <TableCell className="tnum whitespace-nowrap px-3 py-2 text-xs">{r.numero_control}</TableCell>
                          <TableCell className="px-3 py-2 text-xs">{r.nombre}</TableCell>
                          <TableCell className="px-3 py-2 text-xs">{ROL_LABEL[r.rol] ?? r.rol}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {summary.filas_validas.length > MAX_PREVIEW_ROWS && (
                  <p className="tnum text-xs text-muted-foreground">y {summary.filas_validas.length - MAX_PREVIEW_ROWS} más.</p>
                )}
              </section>
            ) : (
              <p className="rounded-md border bg-muted p-3 text-sm">
                <strong className="font-semibold">Ninguna fila es válida.</strong> No hay nada que crear: corrige el archivo con la lista de errores, vuelve y súbelo de nuevo.
              </p>
            )}

            {mustAcknowledge && summary.validas > 0 && (
              <label htmlFor="bulk-omit" className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border bg-card p-3 text-sm">
                <input
                  id="bulk-omit"
                  type="checkbox"
                  checked={omit}
                  onChange={(e) => setOmit(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <span>Entiendo que se omitirán {plural(summary.con_error, "fila", "filas")} con error</span>
              </label>
            )}

            {error && (
              <p role="alert" className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
            <p role="status" aria-live="polite" className={busy === "creando" ? "text-sm text-muted-foreground" : "sr-only"}>
              {busy === "creando" ? "Creando invitaciones… Se envía un correo por cada una, puede tardar. No cierres esta ventana." : ""}
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                aria-disabled={busy ? true : undefined}
                onClick={() => { if (busy) return; setStep("archivo"); setError(""); }}
                className="h-11 sm:h-10"
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={create}
                disabled={!canCreate && !busy}
                aria-disabled={busy ? true : undefined}
                className="h-11 gap-2 sm:h-10"
              >
                {busy === "creando" && <Loader2 className="animate-spin" aria-hidden="true" />}
                {busy === "creando" ? "Creando invitaciones…" : `Crear ${plural(summary.validas, "invitación", "invitaciones")}`}
              </Button>
            </div>
          </div>
        )}

        {step === "resultado" && result && (
          <div className="min-w-0 space-y-4">
            <h3 ref={heading} tabIndex={-1} className="text-sm font-extrabold outline-none">Paso 3: resultado</h3>
            <p className="tnum text-sm">
              <strong className="font-semibold">{plural(result.creadas, "invitación creada", "invitaciones creadas")}</strong>
              {result.omitidas > 0 && <>, {plural(result.omitidas, "fila omitida", "filas omitidas")}</>}.
            </p>

            <ul className="tnum space-y-1.5" aria-label="Estado de los correos">
              <li><LampBadge state={mails.enviadas > 0 ? "verde" : "off"} label={`${mails.enviadas} ${mails.enviadas === 1 ? "enviada" : "enviadas"} por correo`} /></li>
              <li><LampBadge state={mails.fallidas > 0 ? "rojo" : "off"} label={`${mails.fallidas} no se ${mails.fallidas === 1 ? "pudo" : "pudieron"} enviar`} /></li>
              <li><LampBadge state={mails.sinCorreo > 0 ? "ambar" : "off"} label={`${mails.sinCorreo} sin correo configurado`} /></li>
            </ul>

            {pending.length > 0 && (
              <div className="space-y-3 rounded-md border border-border bg-muted p-3">
                <LampBadge state="ambar" label="Se muestran una sola vez" />
                <p className="text-sm text-muted-foreground">
                  <strong className="font-semibold text-foreground">Estos enlaces se muestran una sola vez.</strong> Descarga el CSV con los enlaces de {plural(pending.length, "persona", "personas")} que no {pending.length === 1 ? "recibió" : "recibieron"} el correo y compártelos tú. Cada enlace funciona una sola vez y vence en {expireHours} horas.
                </p>
                <Button type="button" onClick={downloadLinks} className="h-11 w-full gap-2 sm:h-10 sm:w-auto">
                  {downloaded ? <Check aria-hidden="true" /> : <Download aria-hidden="true" />}
                  Descargar enlaces (CSV)
                </Button>
                <p role="status" aria-live="polite" className={downloaded ? "text-sm font-medium" : "sr-only"}>{downloaded ? "Enlaces descargados." : ""}</p>
              </div>
            )}

            {result.errores.length > 0 && (
              <section className="min-w-0 space-y-2" aria-label="Filas omitidas">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold">Filas que no se crearon</h4>
                  <Button type="button" variant="outline" size="sm" className="h-11 gap-2 sm:h-9" onClick={() => downloadErrors(result.errores, "errores-invitaciones.csv")}>
                    <Download aria-hidden="true" /> Descargar errores (CSV)
                  </Button>
                </div>
                <ErrorTable errores={result.errores} label="Filas que no se crearon" />
              </section>
            )}

            {confirmClose && (
              <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
                <p className="text-sm font-semibold text-destructive">¿Cerrar sin descargar los enlaces?</p>
                <p className="text-sm text-muted-foreground">No se vuelven a mostrar.</p>
                <div className="mt-2.5 flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-11 sm:h-9" onClick={() => setConfirmClose(false)}>Volver</Button>
                  <Button type="button" variant="destructive" size="sm" className="h-11 sm:h-9" onClick={requestClose}>Cerrar sin descargar</Button>
                </div>
              </div>
            )}

            <div className="flex sm:justify-end">
              <Button type="button" variant={pending.length > 0 ? "outline" : "default"} onClick={requestClose} className="h-11 w-full sm:h-10 sm:w-28">Listo</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
