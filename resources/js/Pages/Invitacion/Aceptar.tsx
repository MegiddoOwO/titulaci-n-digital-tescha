import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PublicShell from "@/components/layout/PublicShell";

interface InvitacionResumen {
  nombre: string;
  rol: "estudiante" | "asesor" | "administrativo";
  numero_control: string;
  expira_en: string;
}

interface Props {
  valida: boolean;
  invitacion?: InvitacionResumen;
  token?: string;
}

const ROL_PALABRAS: Record<InvitacionResumen["rol"], string> = {
  estudiante: "estudiante",
  asesor: "asesor",
  administrativo: "personal administrativo",
};

const fechaFmt = new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" });

function PasswordField({
  id, label, value, onChange, error, describedBy, hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  describedBy: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-11 pr-12 text-base"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={show}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p id={describedBy} role="alert" className="flex gap-2 text-sm font-medium text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && <p id={describedBy} className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export default function Aceptar({ valida, invitacion }: Props) {
  const form = useForm({ password: "", password_confirmation: "" });

  // A used, expired or revoked link and a link rejected on submit share one generic answer.
  const invalidLink = !valida || !invitacion || Boolean((form.errors as Record<string, string>).token);

  // The server reports a mismatch on `password` itself; show it under the confirmation field.
  const passwordError = form.errors.password;
  const mismatch = passwordError?.includes("confirmación") ?? false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The token is already in the URL this page was opened with.
    form.post(window.location.pathname, {
      onFinish: () => form.reset("password", "password_confirmation"),
    });
  };

  return (
    <PublicShell widthClass="max-w-5xl" back={{ href: "/login", label: "Iniciar sesión" }}>
      <Head title="Invitación" />
      <div className="mx-auto w-full max-w-[26rem] px-4 py-8 md:py-14">
        <section className="rounded-[10px] border border-border bg-card p-5 text-card-foreground sm:p-8" aria-labelledby="inv-titulo">
          {invalidLink ? (
            <>
              <h1 id="inv-titulo" className="text-2xl font-extrabold tracking-tight">
                Enlace inválido o expirado
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Pide una nueva invitación a Control Escolar.</p>
              <Button asChild className="mt-6 h-11 w-full font-semibold">
                <Link href="/login">Ir al inicio de sesión</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 id="inv-titulo" className="text-2xl font-extrabold tracking-tight">
                Te invitaron a SCA-TESCHA
              </h1>
              <dl className="mt-3 space-y-0.5 text-sm text-muted-foreground">
                <div>
                  <dt className="sr-only">Nombre</dt>
                  <dd className="font-semibold text-foreground">{invitacion.nombre}</dd>
                </div>
                <div>
                  <dt className="sr-only">Cuenta</dt>
                  <dd>
                    Cuenta de {ROL_PALABRAS[invitacion.rol]} · matrícula <span className="tnum">{invitacion.numero_control}</span>
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Vigencia</dt>
                  <dd>Este enlace vence el {fechaFmt.format(new Date(invitacion.expira_en))}</dd>
                </div>
              </dl>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                <PasswordField
                  id="inv-password"
                  label="Contraseña"
                  value={form.data.password}
                  onChange={(v) => form.setData("password", v)}
                  error={mismatch ? undefined : passwordError}
                  describedBy="inv-password-ayuda"
                  hint="Mínimo 8 caracteres"
                />
                <PasswordField
                  id="inv-confirmacion"
                  label="Confirmar contraseña"
                  value={form.data.password_confirmation}
                  onChange={(v) => form.setData("password_confirmation", v)}
                  error={mismatch ? passwordError : undefined}
                  describedBy="inv-confirmacion-ayuda"
                />
                <Button type="submit" disabled={form.processing} className="h-11 w-full text-base font-semibold">
                  {form.processing ? "Creando cuenta..." : "Crear mi cuenta"}
                </Button>
              </form>
              <p className="mt-4 text-sm text-muted-foreground">
                El aviso de privacidad se mostrará la primera vez que inicies sesión.
              </p>
            </>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
