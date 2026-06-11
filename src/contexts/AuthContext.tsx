import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiPost, apiGet, getToken, setToken, removeToken, type ApiError } from "@/services/api";

interface Usuario {
  id: number;
  numero_control: string;
  nombre: string;
  apellido_paterno: string;
  rol: "estudiante" | "asesor" | "administrativo";
  email: string;
}

interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  consentido: boolean;
  darConsentimiento: () => Promise<void>;
  login: (numeroControl: string, password: string) => Promise<{ error?: string; bloqueado?: boolean; usuario?: Usuario }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [consentido, setConsentido] = useState(false);

  // Verificar si hay un token guardado al cargar la app
  useEffect(() => {
    const token = getToken();
    if (token) {
      apiGet<{ usuario: Usuario }>("/api/auth/me")
        .then((data) => {
          setUsuario(data.usuario);
          // Verificar consentimiento
          return apiGet<{ consentido: boolean }>("/api/privacidad/consentimiento");
        })
        .then((consent) => {
          if (consent?.consentido) setConsentido(true);
        })
        .catch(() => {
          removeToken();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (numero_control: string, password: string) => {
    try {
      const data = await apiPost<{
        message: string;
        token: string;
        usuario: Usuario;
      }>("/api/auth/login", { numero_control, password });

      setToken(data.token);
      setUsuario(data.usuario);
      // Verificar consentimiento
      try {
        const consent = await apiGet<{ consentido: boolean }>("/api/privacidad/consentimiento");
        if (consent?.consentido) setConsentido(true);
      } catch {}
      return { usuario: data.usuario };
    } catch (err) {
      const apiError = err as ApiError;
      return {
        error: apiError.error || "Error al iniciar sesión",
        bloqueado: apiError.bloqueado,
      };
    }
  }, []);

  const darConsentimiento = useCallback(async () => {
    await apiPost("/api/privacidad/consentimiento", {});
    setConsentido(true);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: !!usuario,
        isLoading,
        consentido,
        darConsentimiento,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
