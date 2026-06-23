import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText, Bell, CheckCircle2, Clock, AlertCircle,
  Upload, LogOut, ClipboardList,
  LayoutDashboard, Calendar, Star, Menu, X, ArrowRight, Gavel, Banknote, Contact, Loader2, Shield, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getToken } from "@/services/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTramite } from "@/hooks/useTramite";
import { useNotificaciones } from "@/hooks/useNotificaciones";
import logo from "@/assets/tescha-logo.svg";

// Helper component for stylized card corners (brackets)
const BracketCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`relative bg-white rounded-md p-6 border border-[#efe1ca]/40 shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-[#BC955B]/40 hover:-translate-y-0.5' : ''} ${className}`}
  >
    {/* Corner brackets */}
    <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#BC955B] rounded-tl-[3px] pointer-events-none opacity-60"></div>
    <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#BC955B] rounded-tr-[3px] pointer-events-none opacity-60"></div>
    <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#BC955B] rounded-bl-[3px] pointer-events-none opacity-60"></div>
    <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#BC955B] rounded-br-[3px] pointer-events-none opacity-60"></div>
    {children}
  </div>
);

const statusIcon: Record<string, React.ReactNode> = {
  aprobado: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  pendiente: <Clock className="w-4 h-4 text-amber-500" />,
  cargado: <Clock className="w-4 h-4 text-blue-500" />,
  en_revision: <AlertCircle className="w-4 h-4 text-amber-500" />,
  rechazado: <AlertCircle className="w-4 h-4 text-rose-500" />,
};

const statusLabel: Record<string, string> = {
  aprobado: "Aprobado",
  pendiente: "Pendiente",
  cargado: "Recibido",
  en_revision: "En Revisión",
  rechazado: "Rechazado",
};

const DirectorioModal = ({ onClose }: { onClose: () => void }) => {
  const [contactos, setContactos] = useState<{ id: number; nombre: string; cargo: string; departamento: string; email: string | null; telefono: string | null; extension: string | null }[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/directorio${params}`)
      .then((r) => r.json())
      .then(setContactos);
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <BracketCard className="w-full max-w-lg bg-white relative animate-scale-in max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-[#56212f] hover:bg-gray-100 rounded-full transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          <h3 className="font-bold text-lg text-[#56212f] flex items-center gap-2 border-b pb-2">
            <Contact className="w-5 h-5 text-[#BC955B]" />
            <span>Directorio Institucional</span>
          </h3>

          <input
            type="text"
            placeholder="Buscar por nombre, cargo o departamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#56212f]"
          />

          <div className="space-y-3">
            {contactos.map((c) => (
              <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#56212f]/10 text-[#56212f] flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {c.nombre.split(" ").filter((w) => w.length > 1).slice(0, 2).map((w) => w[0]).join("")}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-gray-700">{c.nombre}</h4>
                  <p className="text-[11px] text-gray-500">{c.cargo}</p>
                  <p className="text-[10px] text-gray-400">{c.departamento}</p>
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="text-[10px] text-[#8a2036] hover:underline font-medium block mt-0.5">
                      {c.email}
                    </a>
                  )}
                  {c.extension && (
                    <span className="text-[10px] text-gray-400 block">Ext. {c.extension}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </BracketCard>
    </div>
  );
};

const ArcoModal = ({ onClose }: { onClose: () => void }) => {
  const [tipo, setTipo] = useState("acceso");
  const [detalle, setDetalle] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch("/api/solicitudes-arco", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipo, detalle: detalle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEnviado(true);
      toast({ title: "Solicitud enviada", description: data.message });
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <BracketCard className="w-full max-w-md bg-white relative animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-[#56212f] hover:bg-gray-100 rounded-full transition-all z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          <h3 className="font-bold text-lg text-[#56212f] flex items-center gap-2 border-b pb-2">
            <Shield className="w-5 h-5 text-[#BC955B]" />
            <span>Solicitud de Derechos ARCO</span>
          </h3>

          {enviado ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Solicitud enviada correctamente</p>
              <p className="text-xs text-gray-500 mt-1">Será procesada en un máximo de 15 días hábiles.</p>
              <Button onClick={onClose} className="mt-4 bg-[#56212f] text-white text-xs">Cerrar</Button>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                Ejerce tus derechos de Acceso, Rectificación, Cancelación u Oposición sobre tus datos personales.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-medium">Tipo de solicitud</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#56212f] bg-white">
                  <option value="acceso">Acceso a mis datos</option>
                  <option value="rectificacion">Rectificación de datos</option>
                  <option value="cancelacion">Cancelación / Eliminación</option>
                  <option value="oposicion">Oposición al tratamiento</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Detalle (opcional)</label>
                <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)}
                  placeholder="Describe los datos que deseas acceder, rectificar, cancelar o a los que te opones..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#56212f] min-h-[80px] resize-none" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-800">
                <strong>Plazo legal:</strong> Por ley, tu solicitud debe ser respondida en un máximo de 15 días hábiles.
              </div>

              <Button onClick={handleSubmit} disabled={loading}
                className="w-full bg-[#56212f] hover:bg-[#8a2036] text-white font-semibold text-xs">
                {loading ? "Enviando..." : "Enviar solicitud ARCO"}
              </Button>
            </>
          )}
        </div>
      </BracketCard>
    </div>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "requisitos" | "asesores" | "dictamen">("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDirectorioOpen, setIsDirectorioOpen] = useState(false);
  const [isArcoOpen, setIsArcoOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const { tramite, isLoading, historial, uploadDocumento, isUploading } = useTramite();
  const { notificaciones, noLeidas, marcarTodas } = useNotificaciones();

  const userEmail = usuario?.email || "correo@tesch.edu.mx";
  const userName = usuario ? `${usuario.nombre} ${usuario.apellido_paterno}` : "Estudiante SCA-ISC";

  // Métricas desde datos reales
  const progress = tramite?.progreso?.porcentaje ?? 0;
  const approvedCount = tramite?.progreso?.aprobados ?? 0;
  const totalCount = tramite?.progreso?.total ?? 0;
  const pendingCount = (tramite?.progreso?.pendientes ?? 0) + (tramite?.progreso?.cargados ?? 0) + (tramite?.progreso?.en_revision ?? 0);
  const semaforoColor = tramite?.progreso?.color_semaforo ?? "ambar";

  const handleDownload = (docId: number) => {
    const token = getToken();
    window.open(`/api/tramites/${tramite!.id}/documentos/${docId}?token=${token}`, "_blank");
  };

  const handleUploadForDoc = (tipo_documento_id: number, tipo_nombre: string, file: File) => {
    toast({
      title: "Subiendo documento",
      description: `Subiendo "${file.name}" como "${tipo_nombre}"...`,
    });

    uploadDocumento(
      { tipo_documento_id, file },
      {
        onSuccess: () => {
          toast({
            title: "Documento Subido",
            description: `"${tipo_nombre}" ha sido cargado para validación.`,
          });
        },
        onError: (err: Error) => {
          toast({
            title: "Error al subir",
            description: err.message,
            className: "bg-destructive text-destructive-foreground",
          });
        },
      }
    );
  };

  const handleSidebarClick = (tab: "overview" | "documents" | "requisitos" | "asesores" | "dictamen") => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-body">

      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#56212f] text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <img src={logo} alt="TESCHA" className="h-8 w-8 filter brightness-0 invert" />
          <span className="font-semibold text-sm tracking-wide text-[#efe1ca]">SCA-ISC Titulación</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white hover:text-[#efe1ca] focus:outline-none p-1.5 rounded-lg hover:bg-white/10"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 md:z-auto w-64 bg-[#56212f] text-white flex-shrink-0 flex flex-col justify-between transition-transform duration-300 transform
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:sticky md:top-0 md:h-screen overflow-y-auto
      `}>

        {/* Sidebar Header & User Profile Info */}
        <div className="flex flex-col">
          {/* Logo & App name on desktop */}
          <div className="block md:flex items-center gap-3 p-6 border-b border-[#8a2036]/30">
            <img src={logo} alt="TESCHA" className="h-9 w-9 filter brightness-0 invert" />
            <div>
              <h2 className="font-bold text-sm tracking-widest text-[#efe1ca] uppercase">SCA-ISC</h2>
              <p className="text-[10px] text-white/50 tracking-wider">Titulaciones Digitales</p>
            </div>
          </div>

          {/* Student Profile Box */}
          <div className="p-6 border-b border-[#8a2036]/30 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#7a8c6a] flex items-center justify-center text-white font-bold text-lg shadow-sm border border-[#efe1ca]/20">
                U
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[#efe1ca] font-semibold text-sm tracking-wide truncate">{userName}</h4>
                <p className="text-white/60 text-xs truncate mt-0.5">Ingeniería en Sistemas</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => handleSidebarClick("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "overview"
                  ? "bg-sidebar-accent text-sidebar-primary-foreground shadow-inner"
                  : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleSidebarClick("documents")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "documents"
                  ? "bg-sidebar-accent text-sidebar-primary-foreground shadow-inner"
                  : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
            >
              <FileText className="w-4 h-4" />
              <span>Expediente</span>
            </button>

            <button
              onClick={() => handleSidebarClick("asesores")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <UserCheck className="w-4 h-4" />
              <span>Asesores</span>
            </button>

            <button
              onClick={() => setIsArcoOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Shield className="w-4 h-4" />
              <span>Privacidad</span>
            </button>

            <button
              onClick={() => handleSidebarClick("dictamen")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
            >
              <Gavel className="w-4 h-4" />
              <span>Mi Dictamen</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Log out */}
        <div className="p-4 border-t border-[#8a2036]/30">
          <Link
            to="/"
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-white/70 hover:text-red-300 hover:bg-red-950/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </Link>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Main Content Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm md:shadow-none">
          {/* Page Titles & Breadcrumbs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <h2 className="text-xl font-bold text-[#56212f] tracking-tight">Panel de Control</h2>
            <div className="text-xs text-gray-400 hidden sm:flex items-center gap-1.5 font-medium mt-0.5">
              <span>Inicio</span>
              <span className="text-gray-300">&gt;</span>
              <span className="text-[#8a2036] font-semibold">Titulación</span>
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center gap-3.5">
            {/* Notifications Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 text-gray-500 hover:text-[#56212f] transition-all rounded-full hover:bg-gray-100/80 active:scale-95">
                  <Bell className="w-5 h-5" />
                  {noLeidas > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#BC955B] rounded-full ring-1 ring-white"></span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4 shadow-xl border-gray-100 rounded-xl overflow-hidden" align="end">
                <div className="p-4 bg-[#56212f] text-white flex items-center justify-between">
                  <span className="font-semibold text-sm">Notificaciones</span>
                  {noLeidas > 0 && (
                    <span className="bg-[#BC955B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {noLeidas} Nuevas
                    </span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2 space-y-1.5 bg-gray-50">
                  {notificaciones.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs font-medium">
                      No tienes notificaciones pendientes.
                    </div>
                  ) : (
                    notificaciones.map((n) => (
                      <div key={n.id} className={`bg-white border border-gray-100 rounded-lg p-3 flex items-start gap-2.5 shadow-sm ${n.leida ? "opacity-60" : ""}`}>
                        {n.titulo?.includes("Aprobado") ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> :
                         n.titulo?.includes("Rechazado") ? <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" /> :
                         <Bell className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] leading-snug text-gray-700 font-medium">{n.titulo}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{n.mensaje}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString("es-MX")}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notificaciones.length > 0 && (
                  <div className="p-2 bg-white border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => marcarTodas.mutate()}
                      className="w-full text-xs font-semibold text-[#56212f] hover:bg-gray-50 hover:text-[#8a2036]"
                    >
                      Marcar todas como leídas
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Profile Avatar & Email (hidden on small screen) */}
            <div className="flex items-center gap-2">
              <div className="relative group">
                <div className="w-8 h-8 rounded-full bg-[#56212f] flex items-center justify-center border-2 border-[#efe1ca] cursor-pointer hover:border-[#BC955B] transition-all">
                  <span className="text-white text-xs font-bold">
                    {usuario?.nombre?.[0] || "U"}
                  </span>
                </div>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <span className="text-xs font-semibold text-gray-600 hidden lg:block tracking-wide max-w-[120px] truncate">
                {userEmail}
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Primary Page Content Wrapper */}
        <main className="flex-1 p-6 md:p-8">

          {/* Sub-Navigation Tabs */}
          <div className="flex gap-8 border-b border-gray-200 mb-6">
            {(["overview", "documents", "requisitos", "asesores", "dictamen"] as const).map((tab) => {
              const labels = {
                overview: "Resumen",
                documents: "Documentos",
                requisitos: "Requisitos",
                asesores: "Asesores",
                dictamen: "Dictamen"
              };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 font-semibold text-sm relative transition-all duration-200 ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {labels[tab]}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Content */}
          <div className="space-y-6">

            {activeTab === "overview" && (
              <div className="space-y-6 animate-fade-in">
                {isLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#56212f]" />
                    <span className="ml-3 text-gray-500">Cargando tu trámite...</span>
                  </div>
                ) : !tramite ? (
                  <BracketCard className="text-center py-12">
                    <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                    <h3 className="font-bold text-[#56212f] mb-2">Sin trámite activo</h3>
                    <p className="text-sm text-gray-500">No se encontró un trámite de titulación activo. Contacta a Control Escolar.</p>
                  </BracketCard>
                ) : (
                  <>

                {/* Progress Card (Matching styling of burgundy box) */}
                <div className="bg-[#56212f] text-white rounded-lg p-6 md:p-8 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg md:text-xl tracking-wide">Progreso de Titulación</h3>
                    <span className="text-[#BC955B] font-bold text-2xl md:text-3xl">{progress}%</span>
                  </div>

                  {/* Progress bar track & fill */}
                  <div className="w-full h-3 bg-[#3f1621] rounded-full overflow-hidden mb-5">
                    <div
                      className={`h-full transition-all duration-700 ease-out rounded-full ${
                        semaforoColor === "verde" ? "bg-emerald-400" :
                        semaforoColor === "rojo" ? "bg-rose-400" :
                        "bg-[#BC955B]"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      semaforoColor === "verde" ? "bg-emerald-400" :
                      semaforoColor === "rojo" ? "bg-rose-400" :
                      "bg-amber-400"
                    }`} />
                    <span className="text-white/80 text-sm font-medium">
                      {semaforoColor === "verde" ? "Trámite Aprobado" :
                       semaforoColor === "rojo" ? "Documentos Rechazados — Corrige y vuelve a subir" :
                       "Trámite en Proceso"}
                    </span>
                  </div>

                  <p className="text-white/80 text-xs md:text-sm tracking-wide leading-relaxed font-light mt-2">
                    Has completado {approvedCount} de {totalCount} requisitos para tu proceso de titulación. Sigue avanzando para finalizar.
                  </p>
                </div>

                {tramite?.fecha_limite && (
                  <BracketCard className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#BC955B]" />
                        <span className="text-xs font-bold text-[#56212f] uppercase tracking-wider">Fecha límite</span>
                      </div>
                      {(() => {
                        const deadline = new Date(tramite.fecha_limite);
                        const now = new Date();
                        const diff = deadline.getTime() - now.getTime();
                        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                        const isExpired = days < 0;
                        const isUrgent = days <= 30 && days >= 0;
                        return (
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isExpired ? "text-rose-600" : isUrgent ? "text-amber-600" : "text-emerald-600"}`}>
                              {isExpired ? "Vencida" : `${days} días`}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {deadline.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </BracketCard>
                )}

                {/* Metrics Cards (Total, Aprobados, Pendientes) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                  <BracketCard className="flex flex-col justify-between min-h-[110px]">
                    <div className="flex items-center gap-2 text-[#7A6A4E]">
                      <ClipboardList className="w-4 h-4 text-[#BC955B]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Total Requeridos</span>
                    </div>
                    <span className="text-4xl font-extrabold text-[#56212f] leading-none mt-2">{totalCount}</span>
                  </BracketCard>

                  <BracketCard className="flex flex-col justify-between min-h-[110px]">
                    <div className="flex items-center gap-2 text-[#7A6A4E]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Aprobados</span>
                    </div>
                    <span className="text-4xl font-extrabold text-[#56212f] leading-none mt-2">{approvedCount}</span>
                  </BracketCard>

                  <BracketCard className="flex flex-col justify-between min-h-[110px]">
                    <div className="flex items-center gap-2 text-[#7A6A4E]">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Pendientes</span>
                    </div>
                    <span className="text-4xl font-extrabold text-[#56212f] leading-none mt-2">{pendingCount}</span>
                  </BracketCard>

                </div>

                {/* Lo que sigue — Checklist dinámica */}
                {tramite && (
                  <BracketCard className="p-4">
                    <h3 className="font-bold text-[#56212f] text-sm mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#BC955B]" />
                      Lo que sigue
                    </h3>
                    <div className="space-y-1.5">
                      {tramite.documentos
                        .filter(d => d.tipo_documento_obligatorio === 1)
                        .map(doc => {
                          if (doc.estatus === "rechazado") return (
                            <div key={doc.tipo_documento_id} className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 rounded px-3 py-2">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span><strong>{doc.tipo_documento_nombre}</strong> fue rechazado. {doc.motivo_rechazo ? `Motivo: ${doc.motivo_rechazo}` : "Debes corregirlo y volver a subirlo."}</span>
                            </div>
                          );
                          if (doc.estatus === "pendiente") return (
                            <div key={doc.tipo_documento_id} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded px-3 py-2">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Sube tu documento: <strong>{doc.tipo_documento_nombre}</strong></span>
                            </div>
                          );
                          if (doc.estatus === "cargado" || doc.estatus === "en_revision") return (
                            <div key={doc.tipo_documento_id} className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded px-3 py-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                              <span><strong>{doc.tipo_documento_nombre}</strong> está en revisión por el comité.</span>
                            </div>
                          );
                          return null;
                        })}
                      {tramite.documentos.filter(d => d.tipo_documento_obligatorio === 1 && (d.estatus === "pendiente" || d.estatus === "rechazado")).length === 0 &&
                        tramite.documentos.filter(d => d.tipo_documento_obligatorio === 1 && (d.estatus === "cargado" || d.estatus === "en_revision")).length > 0 && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 rounded px-3 py-2 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Todos tus documentos han sido enviados. Espera la revisión del comité.
                        </p>
                      )}
                      {tramite.documentos.filter(d => d.tipo_documento_obligatorio === 1 && d.estatus !== "aprobado").length === 0 && !tramite.dictamen && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 rounded px-3 py-2 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ¡Todos tus documentos están aprobados! Espera el dictamen final.
                        </p>
                      )}
                      {tramite.dictamen && tramite.dictamen.resultado === "aprobado" && (
                        <p className="text-xs text-emerald-700 bg-emerald-100 rounded px-3 py-2 flex items-center gap-2 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ¡Felicidades! Tu trámite ha sido aprobado. Acude a ventanilla.
                        </p>
                      )}
                    </div>
                  </BracketCard>
                )}

                {/* Línea de tiempo del trámite */}
                {historial.length > 0 && (
                  <BracketCard className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#BC955B]" />
                      <h3 className="font-bold text-sm text-[#56212f] uppercase tracking-wider">Historial de tu trámite</h3>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {historial.slice(0, 10).map((entry) => (
                        <div key={entry.id} className="flex gap-3 text-xs">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${
                              entry.estado_nuevo === "aprobado" ? "bg-emerald-500" :
                              entry.estado_nuevo === "rechazado" ? "bg-rose-500" :
                              entry.estado_nuevo === "cargado" ? "bg-blue-500" :
                              "bg-amber-500"
                            }`} />
                            <div className="w-px flex-1 bg-gray-200 mt-1" />
                          </div>
                          <div className="pb-3 flex-1">
                            <p className="font-medium text-gray-700">{entry.comentario}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(entry.fecha).toLocaleString("es-MX")}
                              {entry.usuario_nombre ? ` — ${entry.usuario_nombre}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </BracketCard>
                )}

                {/* Quick Action Cards (2x2 Grid) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <BracketCard
                    onClick={() => setActiveTab("documents")}
                    className="group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#efe1ca]/40 flex items-center justify-center text-[#56212f] group-hover:bg-[#efe1ca]/60 transition-colors">
                          <Upload className="w-5 h-5 text-[#56212f]" />
                        </div>
                        <span className="font-bold text-sm md:text-base text-[#56212f] group-hover:text-[#8a2036] transition-colors">
                          Subir Documentos
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#7A6A4E] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </BracketCard>

                  <BracketCard
                    onClick={() => navigate("/normativa")}
                    className="group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#efe1ca]/40 flex items-center justify-center text-[#56212f] group-hover:bg-[#efe1ca]/60 transition-colors">
                          <Gavel className="w-5 h-5 text-[#56212f]" />
                        </div>
                        <span className="font-bold text-sm md:text-base text-[#56212f] group-hover:text-[#8a2036] transition-colors">
                          Ver Normativa
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#7A6A4E] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </BracketCard>

                  <BracketCard
                    onClick={() => setActiveTab("documents")}
                    className="cursor-pointer group hover:border-[#BC955B]/50 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#efe1ca]/40 flex items-center justify-center text-[#56212f]">
                          <Banknote className="w-5 h-5 text-[#56212f]" />
                        </div>
                        <span className="font-bold text-sm md:text-base text-[#56212f]">
                          Guía de Pago
                        </span>
                      </div>
                    </div>
                  </BracketCard>

                  <BracketCard
                    onClick={() => setIsDirectorioOpen(true)}
                    className="group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[#efe1ca]/40 flex items-center justify-center text-[#56212f] group-hover:bg-[#efe1ca]/60 transition-colors">
                          <Contact className="w-5 h-5 text-[#56212f]" />
                        </div>
                        <span className="font-bold text-sm md:text-base text-[#56212f] group-hover:text-[#8a2036] transition-colors">
                          Directorio
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#7A6A4E] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </BracketCard>

                </div>

                  </>
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="animate-fade-in space-y-4">

                {/* Documents list wrapped in stylized BracketCard */}
                <BracketCard className="p-0 overflow-hidden">

                  {/* Table Header Section */}
                  <div className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
                    <div>
                      <h3 className="font-bold text-base md:text-lg text-[#56212f]">Documentos Requeridos</h3>
                      <p className="text-xs text-gray-500 mt-1">Sube cada archivo en el formato indicado (máx según tipo de documento).</p>
                    </div>
                  </div>

                  {/* Document Items List */}
                  <div className="divide-y divide-gray-100">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-[#56212f]" />
                        <span className="ml-2 text-sm text-gray-500">Cargando documentos...</span>
                      </div>
                    ) : (tramite?.documentos || []).length === 0 ? (
                      <div className="py-12 text-center text-gray-400 text-xs">
                        No se encontraron documentos para tu trámite.
                      </div>
                    ) : (
                      (tramite?.documentos || []).map((doc) => {
                        const puedeSubir = (doc.estatus === "pendiente" || doc.estatus === "rechazado") && !doc.bloqueado;
                        const puedeVer = doc.estatus !== "pendiente" && doc.id !== null;

                        return (
                        <div
                          key={doc.tipo_documento_id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 transition-colors duration-150 gap-3 ${doc.bloqueado ? "bg-muted/50 opacity-60" : "hover:bg-muted/30"}`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs md:text-sm font-semibold text-gray-700 truncate">
                                {doc.tipo_documento_nombre}
                                {doc.tipo_documento_obligatorio === 1 && (
                                  <span className="ml-1 text-[10px] text-rose-500">*</span>
                                )}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {doc.fecha_subida
                                  ? `Subido: ${new Date(doc.fecha_subida).toLocaleDateString("es-MX")} | ${doc.archivo_nombre || ""}`
                                  : doc.bloqueado
                                    ? doc.motivo_bloqueo
                                    : "Aún no subido — " + doc.formato_permitido + " (máx " + doc.tamaño_max_mb + " MB)"}
                              </p>
                              {doc.estatus === "rechazado" && doc.motivo_rechazo && (
                                <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
                                  Motivo: {doc.motivo_rechazo}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:self-center self-end">
                            <div className="flex items-center gap-1.5">
                              {statusIcon[doc.estatus] || <Clock className="w-4 h-4 text-gray-400" />}
                              <Badge
                                className={`text-[10px] font-semibold px-2 py-0.5 border border-transparent tracking-wide transition-colors cursor-default ${
                                  doc.estatus === "aprobado" ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" :
                                  doc.estatus === "rechazado" ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" :
                                  doc.estatus === "cargado" ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" :
                                  doc.estatus === "en_revision" ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" :
                                  "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                }`}
                              >
                                {statusLabel[doc.estatus] || "Pendiente"}
                              </Badge>
                            </div>
                            {/* Botón Subir o Ver */}
                            {puedeSubir && (
                              <>
                                <input
                                  type="file"
                                  id={`upload-${doc.tipo_documento_id}`}
                                  accept={doc.formato_permitido.split(",").map(f => f.trim() === "PDF" ? ".pdf" : f.trim() === "JPEG" ? ".jpg,.jpeg" : f.trim() === "PNG" ? ".png" : ".pdf").join(",")}
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleUploadForDoc(doc.tipo_documento_id, doc.tipo_documento_nombre, e.target.files[0]);
                                      e.target.value = "";
                                    }
                                  }}
                                  className="hidden"
                                />
                                <label htmlFor={`upload-${doc.tipo_documento_id}`}>
                                  <Button
                                    size="sm"
                                    disabled={isUploading}
                                    className="bg-[#56212f] hover:bg-[#8a2036] text-white text-[10px] h-7 px-3 cursor-pointer"
                                    asChild
                                  >
                                    <span>
                                      {isUploading ? (
                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                      ) : (
                                        <Upload className="w-3 h-3 mr-1" />
                                      )}
                                      Subir
                                    </span>
                                  </Button>
                                </label>
                              </>
                            )}
                            {puedeVer && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(doc.id!)}
                                className="text-[10px] h-7 px-3 border-[#56212f] text-[#56212f] hover:bg-[#56212f]/10"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Ver
                              </Button>
                            )}
                          </div>
                        </div>
                      )})
                    )}
                  </div>

                </BracketCard>

              </div>
            )}

            {activeTab === "requisitos" && (
              <div className="animate-fade-in space-y-6">

                {/* Especificaciones de Fotografía (informativo) */}
                <BracketCard className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-[#56212f] mb-1">Especificaciones de Fotografía</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Requisitos obligatorios para tu fotografía tamaño miñón. Si no cumples, será rechazada.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {[
                      "Tamaño miñón (4.5 × 3.5 cm)",
                      "Fondo blanco mate (sin brillos ni sombras)",
                      "Camisa blanca formal",
                      "Saco oscuro (negro o azul marino)",
                      "Sin maquillaje visible",
                      "Sin patillas largas (corte escolar)",
                      "Sin lentes (ni oscuros ni de aumento)",
                      "Frente completamente descubierta (sin fleco sobre cejas)",
                      "Sin retoques digitales ni filtros",
                      "Iluminación uniforme (sin sombras en el rostro)",
                      "Pose frontal (mirando directamente a la cámara)",
                      "Papel fotográfico mate (no brillante)",
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 text-xs text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#BC955B] flex-shrink-0" />
                        {req}
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
                    <strong>Importante:</strong> Las fotografías que no cumplan con estas especificaciones serán rechazadas por el comité de titulación. Deberás repetir el gasto y volver a subirlas.
                  </div>
                </BracketCard>

                {/* Requisitos por Documento (datos reales del trámite) */}
                <BracketCard className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-[#56212f] mb-1">Requisitos por Documento</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Formatos aceptados y tamaños máximos para cada documento de tu trámite de {tramite?.opcion_titulacion || "titulación"}.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-left">
                          <th className="py-2 pr-4 font-semibold text-gray-700">Documento</th>
                          <th className="py-2 pr-4 font-semibold text-gray-700">Formato</th>
                          <th className="py-2 font-semibold text-gray-700">Tamaño máx</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(tramite?.documentos || []).map((doc) => (
                          <tr key={doc.tipo_documento_id} className="border-b border-gray-100">
                            <td className="py-2 pr-4 text-gray-600">
                              {doc.tipo_documento_nombre}
                              {doc.tipo_documento_obligatorio === 1 && <span className="text-rose-500 ml-0.5">*</span>}
                            </td>
                            <td className="py-2 pr-4">
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{doc.formato_permitido}</span>
                            </td>
                            <td className="py-2 text-gray-600">{doc.tamaño_max_mb} MB</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </BracketCard>

                {/* Guía de Pago de Derechos */}
                <BracketCard className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-[#56212f] mb-1">Guía de Pago de Derechos</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Sigue estos pasos para generar correctamente tu línea de captura en el portal estatal.
                    </p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: "Ingresa al portal", desc: "Accede al Portal de Servicios al Contribuyente del Estado de México: sfpya.edomexico.gob.mx" },
                      { step: 2, title: "Selecciona el concepto", desc: "Elige 'Derechos de Titulación Nivel Superior' en el catálogo de servicios." },
                      { step: 3, title: "Genera la línea de captura", desc: "Completa tus datos. La referencia debe contener 18 dígitos. Verifica antes de continuar." },
                      { step: 4, title: "Realiza el pago", desc: "Paga en banco, tienda de conveniencia o banca en línea usando la línea de captura." },
                      { step: 5, title: "Sube el comprobante", desc: "Descarga el comprobante PDF y súbelo en la sección 'Documentos' de este panel." },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-3 p-3 bg-gray-50 rounded-lg border">
                        <div className="w-7 h-7 rounded-full bg-[#56212f] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {item.step}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#56212f]">{item.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
                    <strong>Importante:</strong> La referencia bancaria debe tener exactamente 18 dígitos. Una referencia incorrecta invalidará tu pago.
                  </div>
                </BracketCard>

              </div>
            )}

            {activeTab === "asesores" && (
              <div className="animate-fade-in space-y-6">
                <BracketCard className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-[#56212f] mb-1">Mis Asesores</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Docentes asignados a tu trámite de {tramite?.opcion_titulacion || "titulación"}. Contacta con ellos para coordinar revisiones.
                    </p>
                  </div>

                  {!tramite?.asignaciones || tramite.asignaciones.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Aún no tienes asesores asignados.</p>
                  ) : (
                    <div className="space-y-3">
                      {tramite.asignaciones
                        .filter((a) => a.rol_asignacion === "asesor")
                        .map((asesor, i) => (
                          <div key={i} className="p-4 bg-[#56212f]/5 rounded-lg border border-[#56212f]/10 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#56212f] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {asesor.nombre.charAt(0)}{asesor.apellido_paterno.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#56212f] uppercase bg-[#56212f]/10 px-2 py-0.5 rounded">Asesor</span>
                                <p className="text-sm font-semibold text-gray-800">
                                  {asesor.grado_academico ? `${asesor.grado_academico} ` : ""}{asesor.nombre} {asesor.apellido_paterno}
                                </p>
                              </div>
                              <a href={`mailto:${asesor.email}`} className="text-xs text-[#8a2036] hover:underline block mt-1">
                                {asesor.email}
                              </a>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                Coordina fechas de revisión y entrega de avances con tu asesor.
                              </p>
                            </div>
                          </div>
                        ))}

                      {tramite.asignaciones.filter((a) => a.rol_asignacion === "sinodal").length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-[#56212f] mb-2">Sinodales</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {tramite.asignaciones
                              .filter((a) => a.rol_asignacion === "sinodal")
                              .map((sinodal, i) => (
                                <div key={i} className="p-3 bg-gray-50 rounded-lg border flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#BC955B]/20 text-[#56212f] flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                                    {sinodal.nombre.charAt(0)}{sinodal.apellido_paterno.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-700 truncate">
                                      {sinodal.grado_academico ? `${sinodal.grado_academico} ` : ""}{sinodal.nombre} {sinodal.apellido_paterno}
                                    </p>
                                    <a href={`mailto:${sinodal.email}`} className="text-[10px] text-[#8a2036] hover:underline">
                                      {sinodal.email}
                                    </a>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </BracketCard>
              </div>
            )}

            {activeTab === "dictamen" && (
              <div className="animate-fade-in space-y-6">
                <BracketCard className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-[#56212f] mb-1">Mi Dictamen</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">
                      Resultado oficial de tu proceso de titulación emitido por el comité.
                    </p>
                  </div>

                  {!tramite?.dictamen ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-600">Dictamen pendiente</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                        Tu dictamen estará disponible cuando el comité termine la revisión de tu expediente y emita el resultado oficial.
                      </p>
                    </div>
                  ) : (
                    <div className={`p-6 rounded-xl border-2 ${
                      tramite.dictamen.resultado === "aprobado"
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-rose-50 border-rose-300"
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                          tramite.dictamen.resultado === "aprobado"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}>
                          {tramite.dictamen.resultado === "aprobado" ? (
                            <CheckCircle2 className="w-7 h-7" />
                          ) : (
                            <AlertCircle className="w-7 h-7" />
                          )}
                        </div>
                        <div>
                          <h4 className={`text-xl font-bold ${
                            tramite.dictamen.resultado === "aprobado" ? "text-emerald-800" : "text-rose-800"
                          }`}>
                            {tramite.dictamen.resultado === "aprobado" ? "Trámite Aprobado" : "Trámite Rechazado"}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Emitido por {tramite.dictamen.emitido_por} el {new Date(tramite.dictamen.fecha_emision).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </div>

                      {tramite.dictamen.observaciones && (
                        <div className={`p-3 rounded-lg text-sm ${
                          tramite.dictamen.resultado === "aprobado"
                            ? "bg-emerald-100/50 text-emerald-800"
                            : "bg-rose-100/50 text-rose-800"
                        }`}>
                          <strong>Observaciones:</strong> {tramite.dictamen.observaciones}
                        </div>
                      )}

                      <div className="mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs gap-1.5"
                          onClick={() => {
                            window.open(`/api/tramites/mi-dictamen/pdf?token=${getToken()}`, "_blank");
                          }}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Ver Dictamen PDF
                        </Button>
                      </div>

                      {tramite.dictamen.resultado === "aprobado" && (
                        <div className="mt-4 bg-white rounded-lg p-3 border border-emerald-200 text-xs text-emerald-700">
                          <strong>Próximo paso:</strong> Acude a ventanilla de Control Escolar en horario 08:00–14:00 hrs para continuar con el trámite presencial de titulación.
                        </div>
                      )}

                      {tramite.dictamen.resultado === "rechazado" && (
                        <div className="mt-4 bg-white rounded-lg p-3 border border-rose-200 text-xs text-rose-700">
                          <strong>Importante:</strong> Revisa las observaciones, corrige los documentos señalados y contacta a tu asesor o Control Escolar para continuar con el proceso.
                        </div>
                      )}
                    </div>
                  )}
                </BracketCard>
              </div>
            )}

          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#56212f] text-white py-4 px-6 md:px-8 mt-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-xs border-t border-[#8a2036]/20">
          <p className="text-white/60">
            SCA-ISC &copy; {new Date().getFullYear()} TESCHA - Tecnológico de Estudios Superiores de Chalco.
          </p>
          <div className="flex gap-4 text-white/60">
            <span className="text-xs">Privacidad</span>
            <span className="text-xs">Términos de Uso</span>
            <span className="text-xs">Contacto</span>
          </div>
        </footer>

      </div>

      {/* Directory Dialog (Modal overlay) */}
      {isDirectorioOpen && (
        <DirectorioModal onClose={() => setIsDirectorioOpen(false)} />
      )}

      {/* ARCO Request Modal */}
      {isArcoOpen && (
        <ArcoModal onClose={() => setIsArcoOpen(false)} />
      )}

    </div>
  );
};

export default Dashboard;
