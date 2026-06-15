import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/tescha-logo.svg";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Contraseña muy corta", description: "Mínimo 8 caracteres.", className: "bg-destructive text-destructive-foreground" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      toast({ title: "Contraseña restablecida", description: "Ya puedes iniciar sesión con tu nueva contraseña." });
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf6f0] to-[#efe1ca]/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img src={logo} alt="TESCHA" className="h-16 mx-auto mb-3" />
          <h1 className="font-display text-xl font-bold text-[#56212f]">Restablecer contraseña</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-6">
          {!token ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">Enlace inválido o expirado.</p>
              <Button onClick={() => navigate("/login")} className="mt-4 bg-[#56212f] hover:bg-[#8a2036] text-white">
                Ir al inicio de sesión
              </Button>
            </div>
          ) : done ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-medium">Contraseña actualizada</p>
              <p className="text-xs text-muted-foreground mt-1">Tu contraseña ha sido restablecida exitosamente.</p>
              <Button onClick={() => navigate("/login")} className="mt-4 w-full bg-[#56212f] hover:bg-[#8a2036] text-white">
                Ir al inicio de sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-muted-foreground">Ingresa tu nueva contraseña.</p>
              <div>
                <label className="text-xs font-medium">Nueva contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="h-10 pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#56212f] hover:bg-[#8a2036] text-white font-semibold">
                {loading ? "Guardando..." : "Restablecer contraseña"}
              </Button>
              <button type="button" onClick={() => navigate("/login")} className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
