import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/tescha-logo.svg";
import heroImage from "@/assets/banner-tescha.jpeg";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validDomain = "@tesch.edu.mx";
    if (!email.toLowerCase().endsWith(validDomain)) {
      toast({ 
        title: "Dominio no autorizado", 
        description: `Para registrarte e ingresar, debes usar exclusivamente una cuenta institucional que termine en ${validDomain}.`,
        className: "bg-primary text-primary-foreground border-primary-foreground/20"
      });
      return;
    }

    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", email);
      toast({ title: "Bienvenido", description: "Has iniciado sesión correctamente." });
      navigate("/dashboard", { replace: true });
    }, 1000);
  };



  return (
    <div 
      className="min-h-screen flex relative bg-cover bg-center"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      {/* Oscurecedor/Filtro corporativo para la imagen de fondo */}
      <div className="absolute inset-0 bg-primary/90 backdrop-blur-sm z-0"></div>

      <div className="relative z-10 w-full flex">
        {/* Left - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-md text-center relative z-10">
            <div className="p-4 bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10 inline-block mb-8 shadow-xl">
              <img src={logo} alt="TESCHA" className="h-28 w-28 mx-auto drop-shadow-md hover:scale-105 transition-transform duration-500" />
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
              <Label htmlFor="email" className="font-body text-sm font-medium">Correo Institucional</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@tesch.edu.mx"
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
  </div>
  );
};

export default Login;
