import { useRef, useState } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import { AlertCircle, Check, Copy, Loader2, MailPlus, RefreshCw, Search, UserPlus, Ban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminLayout } from "@/components/admin/AdminLayout";
import { useAdminToasts } from "@/components/admin/adminToasts";
import type { PageProps } from "@/types";

type Rol = "estudiante" | "asesor" | "administrativo";
type Estado = "pendiente" | "aceptada" | "expirada" | "revocada";

interface InvitacionRow {
  id: number;
  numero_control: string;
  email: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  rol: Rol;
  estado: Estado;
  expira_en: string | null;
  aceptada_en: string | null;
  revocada_en: string | null;
}

interface Docente {
  id: number;
  nombre_completo: string;
  carga_actual: number;
  carga_maxima: number | null;
}

interface Props {
  invitaciones: InvitacionRow[];
  total: number;
  page: number;
  totalPages: number;
  filters: { search: string; estado: string };
  opciones: { id: number; nombre: string }[];
  asesores: Docente[];
  expire_hours: number;
}

const ROL_LABEL: Record<Rol, string> = {
  estudiante: "Estudiante",
  asesor: "Asesor",
  administrativo: "Administrativo",
};

const ESTADOS: SegmentedOption<string>[] = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes", short: "Pend." },
  { value: "aceptada", label: "Aceptadas", short: "Acept." },
  { value: "expirada", label: "Vencidas", short: "Venc." },
  { value: "revocada", label: "Revocadas", short: "Revoc." },
];

const dateFmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/** The date that matters for each state, as written text ("Vence ...", "Aceptada ...", "Revocada ..."). */
function fechaTexto(i: InvitacionRow): string {
  if (i.estado === "aceptada" && i.aceptada_en) return `Aceptada el ${dateFmt.format(new Date(i.aceptada_en))}`;
  if (i.estado === "revocada" && i.revocada_en) return `Revocada el ${dateFmt.format(new Date(i.revocada_en))}`;
  if (i.estado === "expirada" && i.expira_en) return `Venció el ${dateFmt.format(new Date(i.expira_en))}`;
  if (i.expira_en) return `Vence el ${dateTimeFmt.format(new Date(i.expira_en))}`;
  return "";
}

function Field({ id, label, error, className, children }: { id: string; label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label htmlFor={id} className="text-xs font-semibold">{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

interface LinkDialogState {
  link: string;
  email: string;
  reenviada: boolean;
}

export default function AdminInvitaciones({ invitaciones, total, page, totalPages, filters, opciones, asesores, expire_hours }: Props) {
  const { failure } = useAdminToasts();
  const [search, setSearch] = useState(filters.search);
  const [estado, setEstado] = useState(filters.estado || "todas");
  const [loading, setLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [asesor, setAsesor] = useState("none");
  const [opcion, setOpcion] = useState(opciones[0] ? String(opciones[0].id) : "");
  const form = useForm({
    numero_control: "", rol: "estudiante" as Rol, email: "", nombre: "", apellido_paterno: "", apellido_materno: "", grado_academico: "",
  });

  // The one-time link lives only in this state: it goes away with the dialog or the page.
  const [linkDialog, setLinkDialog] = useState<LinkDialogState | null>(null);
  const [copied, setCopied] = useState(false);
  const linkInput = useRef<HTMLInputElement>(null);

  const [revokeTarget, setRevokeTarget] = useState<InvitacionRow | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const visit = (next: { search: string; estado: string; page: number }) => {
    router.get(
      "/admin/invitaciones",
      {
        ...(next.search ? { search: next.search } : {}),
        ...(next.estado !== "todas" ? { estado: next.estado } : {}),
        ...(next.page > 1 ? { page: next.page } : {}),
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      },
    );
  };

  const openLink = (p: { props: unknown }, email: string, reenviada: boolean) => {
    const link = (p.props as PageProps).flash?.invitacion_link;
    if (link) {
      setCopied(false);
      setLinkDialog({ link, email, reenviada });
    }
  };

  const openCreate = () => {
    form.reset();
    form.clearErrors();
    setAsesor("none");
    setOpcion(opciones[0] ? String(opciones[0].id) : "");
    setShowCreate(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.data.email;
    form.transform((d) => ({
      numero_control: d.numero_control,
      rol: d.rol,
      email: d.email,
      nombre: d.nombre,
      apellido_paterno: d.apellido_paterno,
      apellido_materno: d.apellido_materno,
      ...(d.rol === "estudiante" ? { opcion_titulacion_id: opcion || null, asesor_id: asesor !== "none" ? asesor : null } : {}),
      ...(d.rol === "asesor" ? { grado_academico: d.grado_academico } : {}),
    }));
    form.post("/admin/invitaciones", {
      preserveScroll: true,
      preserveState: true,
      onSuccess: (p) => {
        setShowCreate(false);
        form.reset();
        openLink(p, email, false);
      },
    });
  };

  const handleResend = (row: InvitacionRow) => {
    router.post(`/admin/invitaciones/${row.id}/reenviar`, {}, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setResendingId(row.id),
      onFinish: () => setResendingId(null),
      onSuccess: (p) => openLink(p, row.email, true),
      onError: failure,
    });
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    router.delete(`/admin/invitaciones/${revokeTarget.id}`, {
      preserveScroll: true,
      preserveState: true,
      onError: failure,
      onStart: () => setRevoking(true),
      onFinish: () => {
        setRevoking(false);
        setRevokeTarget(null);
      },
    });
  };

  const copyLink = async () => {
    if (!linkDialog) return;
    try {
      await navigator.clipboard.writeText(linkDialog.link);
    } catch {
      // Insecure context or denied permission: select the text and use the legacy command.
      linkInput.current?.select();
      document.execCommand("copy");
    }
    setCopied(true);
  };

  const hasFilters = search.trim() !== "" || estado !== "todas";
  const errorList = Object.values(form.errors);
  const err = (k: keyof typeof form.data | "opcion_titulacion_id" | "asesor_id") => (form.errors as Record<string, string | undefined>)[k];
  const describe = (k: Parameters<typeof err>[0], id: string) => (err(k) ? `${id}-error` : undefined);

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-4 px-4 py-6 sm:px-8">
      <Head title="Invitaciones" />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-2xl font-extrabold">Invitaciones</h1>
          <p className="tnum text-sm text-muted-foreground">
            {total} {total === 1 ? "invitación" : "invitaciones"}
            {hasFilters ? " con los filtros aplicados" : total === 1 ? " registrada" : " registradas"}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <UserPlus aria-hidden="true" /> Nueva invitación
        </Button>
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="flex flex-1 gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Buscar invitaciones"
              placeholder="Matrícula, nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => e.key === "Enter" && visit({ search, estado, page: 1 })}
            />
          </div>
          <Button variant="outline" onClick={() => visit({ search, estado, page: 1 })} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" aria-label="Buscando" /> : "Buscar"}
          </Button>
        </div>
        <SegmentedControl
          options={ESTADOS}
          value={estado}
          label="Filtrar por estado"
          onChange={(v) => {
            setEstado(v);
            visit({ search, estado: v, page: 1 });
          }}
        />
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground" aria-label="Lista de invitaciones">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando invitaciones...
          </div>
        ) : invitaciones.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <MailPlus className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">
              {hasFilters ? "No hay invitaciones con esos filtros." : "Todavía no hay invitaciones."}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {hasFilters
                ? "Prueba con otra matrícula, nombre o correo, o cambia el estado."
                : "Con \"Nueva invitación\" generas un enlace de un solo uso para que la persona cree su cuenta y elija su contraseña."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Persona</TableHead>
                <TableHead className="hidden md:table-cell">Rol</TableHead>
                <TableHead className="hidden lg:table-cell">Correo</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                <TableHead className="w-px"><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitaciones.map((i) => {
                const nombre = `${i.nombre} ${i.apellido_paterno}`;
                const puedeReenviar = i.estado === "pendiente" || i.estado === "expirada";
                const puedeRevocar = i.estado === "pendiente";
                return (
                  <TableRow key={i.id}>
                    <TableCell className="py-2.5">
                      <p className="text-sm font-semibold leading-snug">{nombre}</p>
                      <p className="tnum text-xs text-muted-foreground">
                        {i.numero_control}
                        <span className="md:hidden"> · {ROL_LABEL[i.rol]}</span>
                      </p>
                      <p className="mt-0.5 break-all text-xs text-muted-foreground lg:hidden">{i.email}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 md:hidden">
                        <StatusBadge kind="invitacion" status={i.estado} />
                        <span className="text-xs text-muted-foreground lg:hidden">{fechaTexto(i)}</span>
                      </div>
                      <p className="mt-1 hidden text-xs text-muted-foreground md:block lg:hidden">{fechaTexto(i)}</p>
                    </TableCell>
                    <TableCell className="hidden py-2.5 text-sm md:table-cell">{ROL_LABEL[i.rol]}</TableCell>
                    <TableCell className="hidden py-2.5 text-sm text-muted-foreground lg:table-cell">{i.email}</TableCell>
                    <TableCell className="hidden py-2.5 md:table-cell">
                      <StatusBadge kind="invitacion" status={i.estado} />
                    </TableCell>
                    <TableCell className="tnum hidden whitespace-nowrap py-2.5 text-sm text-muted-foreground lg:table-cell">{fechaTexto(i)}</TableCell>
                    <TableCell className="py-2.5 pr-3 align-top md:align-middle">
                      <div className="flex flex-nowrap items-center justify-end gap-0.5">
                        {puedeReenviar && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-11 w-11 sm:h-9 sm:w-9"
                            onClick={() => handleResend(i)}
                            disabled={resendingId === i.id}
                            aria-label={`Reenviar invitación a ${nombre}`}
                            title="Reenviar (el enlace anterior deja de funcionar)"
                          >
                            {resendingId === i.id ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
                          </Button>
                        )}
                        {puedeRevocar && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-11 w-11 hover:bg-destructive/10 hover:text-destructive sm:h-9 sm:w-9"
                            onClick={() => setRevokeTarget(i)}
                            aria-label={`Revocar invitación de ${nombre}`}
                            title="Revocar"
                          >
                            <Ban aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Paginación">
          <span className="tnum text-xs text-muted-foreground">Página {page} de {totalPages} ({total} invitaciones)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => visit({ search, estado, page: page - 1 })}>Anterior</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => visit({ search, estado, page: page + 1 })}>Siguiente</Button>
          </div>
        </nav>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva invitación</DialogTitle>
            <DialogDescription>
              La persona recibe un enlace para elegir su contraseña. Los datos de su cuenta los defines tú aquí.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3" noValidate>
            {errorList.length > 0 && (
              <p role="alert" className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {errorList[0]}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="inv-matricula" label="Matrícula / Número de control *" error={err("numero_control")}>
                <Input
                  id="inv-matricula"
                  value={form.data.numero_control}
                  onChange={(e) => form.setData("numero_control", e.target.value)}
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-invalid={err("numero_control") ? true : undefined}
                  aria-describedby={describe("numero_control", "inv-matricula")}
                />
              </Field>
              <Field id="inv-rol" label="Rol *" error={err("rol")}>
                <Select value={form.data.rol} onValueChange={(v) => form.setData("rol", v as Rol)}>
                  <SelectTrigger id="inv-rol"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estudiante">Estudiante</SelectItem>
                    <SelectItem value="asesor">Asesor</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field id="inv-email" label="Correo *" error={err("email")}>
              <Input
                id="inv-email"
                type="email"
                autoComplete="off"
                value={form.data.email}
                onChange={(e) => form.setData("email", e.target.value)}
                aria-invalid={err("email") ? true : undefined}
                aria-describedby={describe("email", "inv-email")}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="inv-nombre" label="Nombre *" error={err("nombre")}>
                <Input
                  id="inv-nombre"
                  value={form.data.nombre}
                  onChange={(e) => form.setData("nombre", e.target.value)}
                  aria-invalid={err("nombre") ? true : undefined}
                  aria-describedby={describe("nombre", "inv-nombre")}
                />
              </Field>
              <Field id="inv-paterno" label="Apellido paterno *" error={err("apellido_paterno")}>
                <Input
                  id="inv-paterno"
                  value={form.data.apellido_paterno}
                  onChange={(e) => form.setData("apellido_paterno", e.target.value)}
                  aria-invalid={err("apellido_paterno") ? true : undefined}
                  aria-describedby={describe("apellido_paterno", "inv-paterno")}
                />
              </Field>
            </div>
            <Field id="inv-materno" label="Apellido materno (opcional)" error={err("apellido_materno")}>
              <Input
                id="inv-materno"
                value={form.data.apellido_materno}
                onChange={(e) => form.setData("apellido_materno", e.target.value)}
                aria-describedby={describe("apellido_materno", "inv-materno")}
              />
            </Field>
            {form.data.rol === "estudiante" && (
              <>
                <Field id="inv-opcion" label="Opción de titulación" error={err("opcion_titulacion_id")}>
                  <Select value={opcion} onValueChange={setOpcion}>
                    <SelectTrigger id="inv-opcion"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {opciones.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>{o.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="inv-asesor" label="Asesor (opcional)" error={err("asesor_id")}>
                  <Select value={asesor} onValueChange={setAsesor}>
                    <SelectTrigger id="inv-asesor"><SelectValue placeholder="Sin asesor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asesor</SelectItem>
                      {asesores.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)} disabled={d.carga_actual >= (d.carga_maxima || 5)}>
                          {d.nombre_completo} ({d.carga_actual}/{d.carga_maxima || 5})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}
            {form.data.rol === "asesor" && (
              <Field id="inv-grado" label="Grado académico (opcional)" error={err("grado_academico")}>
                <Input
                  id="inv-grado"
                  value={form.data.grado_academico}
                  onChange={(e) => form.setData("grado_academico", e.target.value)}
                  placeholder="Mtra., Dr., etc."
                  aria-describedby={describe("grado_academico", "inv-grado")}
                />
              </Field>
            )}
            <Button type="submit" disabled={form.processing} className="w-full">
              {form.processing ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Crear invitación
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialog !== null} onOpenChange={(open) => { if (!open) setLinkDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{linkDialog?.reenviada ? "Invitación reenviada" : "Invitación creada"}</DialogTitle>
            <DialogDescription>
              Copia el enlace y envíalo a la persona. Cierra esta ventana solo cuando lo hayas guardado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="inv-enlace" className="text-xs font-semibold">Enlace de invitación</label>
              <Input
                id="inv-enlace"
                ref={linkInput}
                readOnly
                value={linkDialog?.link ?? ""}
                onFocus={(e) => e.currentTarget.select()}
                className="tnum text-xs"
              />
            </div>
            <Button type="button" onClick={copyLink} className="w-full gap-2">
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied ? "Enlace copiado" : "Copiar enlace"}
            </Button>
            <p role="status" aria-live="polite" className="sr-only">{copied ? "Enlace copiado" : ""}</p>
            <p className="text-sm text-muted-foreground">
              Este enlace se muestra una sola vez. Funciona una sola vez y vence en {expire_hours} horas. Si el correo del sistema está configurado,
              también se envió a {linkDialog?.email}.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeTarget !== null} onOpenChange={(open) => { if (!open && !revoking) setRevokeTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revocar invitación</AlertDialogTitle>
            <AlertDialogDescription>
              El enlace enviado a {revokeTarget?.nombre} {revokeTarget?.apellido_paterno} dejará de funcionar y no se creará la cuenta.
              Podrás crear otra invitación después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoking}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRevoke();
              }}
              disabled={revoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revoking ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Ban aria-hidden="true" />}
              Revocar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

AdminInvitaciones.layout = adminLayout;
