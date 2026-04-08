import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/tescha-logo.svg";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("isAuthenticated", "true");
      toast({ title: "Bienvenido", description: "Has iniciado sesión correctamente." });
      navigate("/dashboard", { replace: true });
    }, 1000);
  };

  useEffect(() => {
    if (localStorage.getItem("isAuthenticated") === "true") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <img src={logo} alt="TESCHA" className="h-24 w-24 mx-auto mb-8" />
          <h1 className="font-display text-4xl font-bold text-primary-foreground mb-4">
            Sistema de Titulación ISC
          </h1>
          <p className="text-primary-foreground/70 font-body text-lg leading-relaxed">
            Plataforma digital para la gestión integral del proceso de titulación del Tecnológico de Estudios Superiores de Chalco.
          </p>
          <div className="mt-12 flex items-center justify-center gap-2 text-accent">
            <GraduationCap className="w-5 h-5" />
            <span className="font-body text-sm font-medium">Ingeniería en Sistemas Computacionales</span>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card rounded-xl shadow-2xl p-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
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
              <Label htmlFor="email" className="font-body text-sm font-medium">Correo Institucional</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@tescha.edu.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-body text-sm font-medium">Contraseña</Label>
                <button type="button" className="text-accent font-body text-xs hover:underline">
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
              <Link to="/" className="text-accent font-medium hover:underline">
                Contacta a tu coordinación
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
