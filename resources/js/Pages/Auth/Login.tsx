import { useEffect, useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import { Eye, EyeOff, GraduationCap, Mail, X, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/tescha-logo.svg";
import heroImage from "@/assets/banner-tescha.jpeg";

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

const Login = ({ status, bloqueado, contactos }: LoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { toast } = useToast();

  const loginForm = useForm({ numero_control: "", password: "" });
  const forgotForm = useForm({ numero_control: "" });
  const loading = loginForm.processing;
  const forgotLoading = forgotForm.processing;
  const numeroControl = loginForm.data.numero_control;
  const password = loginForm.data.password;
  const forgotNumeroControl = forgotForm.data.numero_control;
  const setNumeroControl = (v: string) => loginForm.setData("numero_control", v);
  const setPassword = (v: string) => loginForm.setData("password", v);
  const setForgotNumeroControl = (v: string) => forgotForm.setData("numero_control", v);

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    forgotForm.post("/forgot-password", {
      preserveScroll: true,
      onSuccess: (page) => {
        setForgotSent(true);
        toast({ title: "Solicitud enviada", description: (page.props.status as string | null) ?? undefined });
      },
      onError: (errors) => {
        toast({
          title: "Error",
          description: errors.numero_control || "Error al enviar solicitud.",
          className: "bg-destructive text-destructive-foreground",
        });
      },
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginForm.post("/login", {
      onFinish: () => loginForm.reset("password"),
    });
  };

  // The server redirects here after a successful password reset (legacy showed an in-page panel).
  useEffect(() => {
    if (status && !forgotSent) {
      toast({ title: "Contraseña restablecida", description: "Ya puedes iniciar sesión con tu nueva contraseña." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The lockout flag arrives with the redirect as the `bloqueado` page prop, so the toast is raised
  // once the new props are rendered.
  const loginErrors = loginForm.errors;
  useEffect(() => {
    const message = loginErrors.numero_control || loginErrors.password;
    if (!message) return;
    toast({
      title: bloqueado ? "Cuenta bloqueada" : "Error de autenticación",
      description: message,
      className: "bg-destructive text-destructive-foreground border-destructive-foreground/20",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginErrors]);

  return (
    <div 
      className="min-h-screen flex relative bg-cover bg-center"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <Head title="Iniciar Sesión" />
      {/* Oscurecedor/Filtro corporativo para la imagen de fondo */}
      <div className="absolute inset-0 bg-primary/90 backdrop-blur-sm z-0"></div>

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="relative z-10 w-full flex">
        {/* Left - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-md text-center relative z-10">
            <div className="p-4 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 inline-block mb-8 shadow-xl">
                <img src={logo} alt="Escudo del Tecnológico de Estudios Superiores de Chalco" className="h-28 w-28 mx-auto drop-shadow-md hover:scale-105 transition-transform duration-500" />
            </div>
            
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 drop-shadow-sm leading-tight">
              Sistema de Titulación <span className="text-accent font-light">ISC</span>
            </h1>
            <p className="text-primary-foreground/80 font-body text-lg leading-relaxed mb-10">
              Plataforma digital interactiva para la gestión integral del proceso de titulación del Tecnológico de Estudios Superiores de Chalco.
            </p>
            
            <div className="inline-flex items-center justify-center gap-3 text-accent bg-accent/10 border border-accent/20 px-6 py-3 rounded-full shadow-inner">
              <GraduationCap className="w-5 h-5" />
              <span className="font-body text-sm font-semibold tracking-wide uppercase">Ingeniería en Sistemas Computacionales</span>
            </div>
          </div>
        </div>

        {/* Right - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/50 p-10 transform transition-all hover:-translate-y-1 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)]">
            <div className="lg:hidden flex items-center gap-3 mb-8 bg-primary/5 p-3 rounded-xl border border-primary/10">
            <img src={logo} alt="TESCHA" className="h-10 w-10" />
            <div>
              <p className="font-body text-sm font-semibold text-foreground">TESCHA</p>
              <p className="font-body text-xs text-muted-foreground">Sistema de Titulación</p>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Iniciar Sesión</h2>
          <p className="text-muted-foreground font-body text-sm mb-8">
            Ingresa tus credenciales institucionales para acceder al sistema.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="numero-control" className="font-body text-sm font-medium">Número de Control</Label>
              <Input
                id="numero-control"
                type="text"
                placeholder="2021-0001"
                value={numeroControl}
                onChange={(e) => setNumeroControl(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-body text-sm font-medium">Contraseña</Label>
                <button type="button" onClick={() => { setForgotNumeroControl(""); setForgotSent(false); setShowForgotModal(true); }} className="text-accent font-body text-xs hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground hover:bg-navy-light font-semibold" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground font-body text-sm">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => setShowRegistroModal(true)}
                className="text-accent font-medium hover:underline bg-transparent border-0 cursor-pointer"
              >
                Solicita tu acceso aquí
              </button>
            </p>
          </div>
        </div>
      </div>
       
      {/* Modal de registro */}
      {showRegistroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="bg-[#56212f] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-[#BC955B]" />
                <div>
                  <h2 className="font-display text-lg font-bold">¿Cómo obtener acceso?</h2>
                  <p className="text-white/70 text-xs">Registro gestionado por la institución</p>
                </div>
              </div>
              <button onClick={() => setShowRegistroModal(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                El registro en el sistema es <strong>exclusivamente institucional</strong>. Para solicitar tu alta,
                envía un correo a alguno de los siguientes contactos incluyendo tu <strong>número de control</strong> y <strong>nombre completo</strong>.
              </p>

              <div className="space-y-3">
                {contactos.map((c) => (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-lg border flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#56212f]/10 text-[#56212f] flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {c.nombre.split(" ").filter((w: string) => w.length > 1).slice(0, 2).map((w: string) => w[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-700">{c.nombre}</p>
                      <p className="text-xs text-gray-500">{c.cargo} — {c.departamento}</p>
                      {c.email && (
                        <a href={`mailto:${c.email}?subject=Solicitud de alta - SCA-ISC&body=Estimado/a, solicito mi alta en el Sistema de Titulación.%0D%0A%0D%0ANúmero de control: %0D%0ANombre completo: %0D%0A`}
                          className="text-xs text-[#8a2036] hover:underline font-semibold flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" /> {c.email}
                        </a>
                      )}
                      {c.extension && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Ext. {c.extension}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <strong>Importante:</strong> Solo el personal autorizado (Control Escolar y Jefatura de División) puede dar de alta nuevos usuarios en la plataforma.
              </div>

              <Button
                onClick={() => setShowRegistroModal(false)}
                className="w-full bg-[#56212f] hover:bg-[#8a2036] text-white font-semibold"
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Recuperar contraseña</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            {forgotSent ? (
              <div className="text-center py-6">
                <Send className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-medium">Solicitud enviada</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Si el número de control existe, recibirás un correo con instrucciones.
                </p>
                <Button onClick={() => setShowForgotModal(false)} className="mt-4 w-full bg-[#56212f] hover:bg-[#8a2036] text-white">
                  Cerrar
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Ingresa tu número de control. Te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <div>
                  <label className="text-xs font-medium">Número de Control</label>
                  <Input value={forgotNumeroControl} onChange={e => setForgotNumeroControl(e.target.value)} required placeholder="Ej: 202324055" className="h-10" />
                </div>
                <Button type="submit" disabled={forgotLoading} className="w-full bg-[#56212f] hover:bg-[#8a2036] text-white font-semibold">
                  {forgotLoading ? "Enviando..." : "Enviar enlace"}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  </div>
  );
};

export default Login;
