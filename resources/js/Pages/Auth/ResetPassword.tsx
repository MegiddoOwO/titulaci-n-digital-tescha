import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PublicShell from "@/components/layout/PublicShell";

const ResetPassword = ({ token }: { token: string | null }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [shortError, setShortError] = useState(false);
  const form = useForm({ token: token ?? "", password: "", password_confirmation: "" });

  // A missing token, or one the server rejects, leaves nothing to fix on this form.
  const invalidLink = !token || Boolean(form.errors.token);
  const fieldError = shortError ? "Mínimo 8 caracteres." : form.errors.password || (form.hasErrors && !form.errors.token ? "Error al restablecer la contraseña." : undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.data.password.length < 8) {
      setShortError(true);
      return;
    }
    setShortError(false);
    // The form has a single field; the server contract requires the confirmation too.
    form.transform((data) => ({ ...data, password_confirmation: data.password }));
    form.post("/reset-password");
  };

  return (
    <PublicShell widthClass="max-w-5xl" back={{ href: "/login", label: "Iniciar sesión" }}>
      <Head title="Restablecer contraseña" />
      <div className="mx-auto w-full max-w-[26rem] px-4 py-8 md:py-14">
        <section className="rounded-[10px] border border-border bg-card p-5 text-card-foreground sm:p-8" aria-labelledby="reset-titulo">
          {invalidLink ? (
            <>
              <h1 id="reset-titulo" className="text-2xl font-extrabold tracking-tight">
                Enlace inválido o expirado
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Solicita un enlace nuevo desde el inicio de sesión con «¿Olvidaste tu contraseña?».
              </p>
              <Button asChild className="mt-6 h-11 w-full font-semibold">
                <Link href="/login">Ir al inicio de sesión</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 id="reset-titulo" className="text-2xl font-extrabold tracking-tight">
                Restablecer contraseña
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Ingresa tu nueva contraseña.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nueva-password">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="nueva-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={form.data.password}
                      onChange={(e) => {
                        setShortError(false);
                        form.setData("password", e.target.value);
                      }}
                      placeholder="Mínimo 8 caracteres"
                      required
                      aria-invalid={fieldError ? true : undefined}
                      aria-describedby={fieldError ? "reset-error" : "reset-ayuda"}
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
                  {fieldError ? (
                    <p id="reset-error" role="alert" className="flex gap-2 text-sm font-medium text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {fieldError}
                    </p>
                  ) : (
                    <p id="reset-ayuda" className="text-sm text-muted-foreground">
                      Mínimo 8 caracteres.
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={form.processing} className="h-11 w-full text-base font-semibold">
                  {form.processing ? "Guardando..." : "Restablecer contraseña"}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </PublicShell>
  );
};

export default ResetPassword;
