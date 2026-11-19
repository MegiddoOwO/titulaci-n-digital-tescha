import { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import { AlertCircle, Eye, EyeOff, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LampBadge } from "@/components/ui/lamp";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import logo from "@/assets/tescha-logo.svg";
import PublicShell from "@/components/layout/PublicShell";

interface Contacto {
  id: number;
  nombre: string;
  cargo: string;
  departamento: string;
  email: string | null;
  extension: string | null;
}

interface LoginProps {
  status?: string | null;
  bloqueado?: boolean;
  contactos: Contacto[];
}

const linkButton =
  "rounded-sm font-semibold text-foreground underline underline-offset-4 decoration-muted-foreground/60 hover:decoration-foreground";

const Login = ({ status, bloqueado, contactos }: LoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const loginForm = useForm({ numero_control: "", password: "" });
  const forgotForm = useForm({ numero_control: "" });

  // The server redirects here after a successful password reset.
  const [resetNotice] = useState(Boolean(status));

  const loginError = loginForm.errors.numero_control || loginForm.errors.password;
  const forgotError = forgotForm.errors.numero_control || (forgotForm.hasErrors ? "Error al enviar solicitud." : undefined);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginForm.post("/login", {
      onFinish: () => loginForm.reset("password"),
    });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    forgotForm.post("/forgot-password", {
      preserveScroll: true,
      onSuccess: () => setForgotSent(true),
    });
  };

  const openForgot = () => {
    forgotForm.reset();
    forgotForm.clearErrors();
    setForgotSent(false);
    setShowForgotModal(true);
  };

  return (
    <PublicShell widthClass="max-w-5xl">
      <Head title="Iniciar Sesión" />

      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-8 md:px-6 md:py-14 lg:min-h-[calc(100dvh-7.5rem)] lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-center lg:gap-16">
        <section className="hidden lg:block" aria-label="Sobre el sistema">
          <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-[10px] border border-border bg-white p-2.5">
            <img src={logo} alt="Escudo del Tecnológico de Estudios Superiores de Chalco" className="h-full w-full object-contain" />
          </span>
          <h2 className="max-w-[16ch] text-4xl font-extrabold leading-[1.1] tracking-tight">Sistema de Titulación ISC</h2>
          <p className="mt-5 max-w-[46ch] text-base leading-7 text-muted-foreground">
            Plataforma digital para la gestión integral del proceso de titulación del Tecnológico de Estudios Superiores de Chalco.
          </p>
          <p className="mt-6 text-sm font-semibold">Ingeniería en Sistemas Computacionales</p>
        </section>

        <section className="w-full rounded-[10px] border border-border bg-card p-5 text-card-foreground sm:p-8" aria-labelledby="login-titulo">
          <h1 id="login-titulo" className="text-2xl font-extrabold tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Ingresa tus credenciales institucionales para acceder al sistema.</p>

          {resetNotice && !loginError && (
            <div role="status" className="mt-5 rounded-md border border-border bg-muted p-3">
              <LampBadge state="verde" label="Contraseña restablecida" />
              <p className="mt-1.5 text-sm text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="numero-control">Número de Control</Label>
              <Input
                id="numero-control"
                type="text"
                autoComplete="username"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="2021-0001"
                value={loginForm.data.numero_control}
                onChange={(e) => loginForm.setData("numero_control", e.target.value)}
                required
                aria-invalid={loginError ? true : undefined}
                aria-describedby={loginError ? "login-error" : undefined}
                className="h-11 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginForm.data.password}
                  onChange={(e) => loginForm.setData("password", e.target.value)}
                  required
                  aria-invalid={loginError ? true : undefined}
                  aria-describedby={loginError ? "login-error" : undefined}
                  className="h-11 pr-12 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              <p className="text-sm">
                <button type="button" onClick={openForgot} className={`${linkButton} min-h-[44px] sm:min-h-0`}>
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
            </div>

            {loginError && (
              <div
                id="login-error"
                role="alert"
                className="flex gap-2.5 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-foreground"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-destructive">{bloqueado ? "Cuenta bloqueada" : "Error de autenticación"}</p>
                  <p className="mt-0.5">{loginError}</p>
                </div>
              </div>
            )}

            <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={loginForm.processing}>
              {loginForm.processing ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <button type="button" onClick={() => setShowRegistroModal(true)} className={`${linkButton} min-h-[44px] sm:min-h-0`}>
              Solicita tu acceso aquí
            </button>
          </p>
        </section>
      </div>

      <Dialog open={showRegistroModal} onOpenChange={setShowRegistroModal}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">¿Cómo obtener acceso?</DialogTitle>
            <DialogDescription>Registro gestionado por la institución</DialogDescription>
          </DialogHeader>

          <p className="text-sm leading-6">
            El registro en el sistema es <strong>exclusivamente institucional</strong>. Para solicitar tu alta, envía un correo a alguno de los
            siguientes contactos incluyendo tu <strong>número de control</strong> y <strong>nombre completo</strong>.
          </p>

          <ul className="divide-y divide-border rounded-md border border-border">
            {contactos.map((c) => (
              <li key={c.id} className="p-3">
                <p className="text-sm font-semibold">{c.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {c.cargo} — {c.departamento}
                </p>
                {c.email && (
                  <a
                    href={`mailto:${c.email}?subject=Solicitud de alta - SCA-ISC&body=Estimado/a, solicito mi alta en el Sistema de Titulación.%0D%0A%0D%0ANúmero de control: %0D%0ANombre completo: %0D%0A`}
                    className="mt-1 inline-flex min-h-[44px] items-center gap-1.5 break-all rounded-sm text-sm font-semibold underline underline-offset-4 sm:min-h-0"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {c.email}
                  </a>
                )}
                {c.extension && <p className="tnum text-xs text-muted-foreground">Ext. {c.extension}</p>}
              </li>
            ))}
          </ul>

          <p className="rounded-md bg-muted p-3 text-sm leading-6">
            <strong>Importante:</strong> Solo el personal autorizado (Control Escolar y Jefatura de División) puede dar de alta nuevos usuarios en la
            plataforma.
          </p>

          <DialogClose asChild>
            <Button className="h-11 w-full font-semibold">Entendido</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Recuperar contraseña</DialogTitle>
            <DialogDescription>
              {forgotSent ? "Revisa tu correo institucional." : "Ingresa tu número de control. Te enviaremos un enlace para restablecer tu contraseña."}
            </DialogDescription>
          </DialogHeader>

          {forgotSent ? (
            <div role="status" className="space-y-4">
              <div className="rounded-md border border-border bg-muted p-3">
                <LampBadge state="verde" label="Solicitud enviada" />
                <p className="mt-1.5 text-sm text-muted-foreground">Si el número de control existe, recibirás un correo con instrucciones.</p>
              </div>
              <Button onClick={() => setShowForgotModal(false)} className="h-11 w-full font-semibold">
                Cerrar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-numero-control">Número de Control</Label>
                <Input
                  id="forgot-numero-control"
                  value={forgotForm.data.numero_control}
                  onChange={(e) => forgotForm.setData("numero_control", e.target.value)}
                  required
                  autoComplete="username"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="Ej: 202324055"
                  aria-invalid={forgotError ? true : undefined}
                  aria-describedby={forgotError ? "forgot-error" : undefined}
                  className="h-11 text-base"
                />
              </div>
              {forgotError && (
                <p id="forgot-error" role="alert" className="flex gap-2 text-sm font-medium text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {forgotError}
                </p>
              )}
              <Button type="submit" disabled={forgotForm.processing} className="h-11 w-full font-semibold">
                {forgotForm.processing ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
};

export default Login;
