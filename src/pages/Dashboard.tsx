import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText, Bell, CheckCircle2, Clock, AlertCircle,
  Upload, LogOut, ClipboardList,
  LayoutDashboard, Calendar, Star, Settings, Menu, X, ArrowRight, Gavel, Banknote, Contact
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/tescha-logo.svg";
import reqImage1 from "@/assets/TITULO26_1_001.png";
import reqImage2 from "@/assets/TITULO26_2_001.png";

// Helper component for stylized card corners (brackets)
const BracketCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`relative bg-white rounded-md p-6 border border-[#efe1ca]/40 shadow-sm transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''} ${className}`}
  >
    {/* Corner brackets */}
    <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#BC955B] rounded-tl-[3px] pointer-events-none opacity-60"></div>
    <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[#BC955B] rounded-tr-[3px] pointer-events-none opacity-60"></div>
    <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[#BC955B] rounded-bl-[3px] pointer-events-none opacity-60"></div>
    <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#BC955B] rounded-br-[3px] pointer-events-none opacity-60"></div>
    {children}
  </div>
);

const notificationsData = [
  { id: 1, message: "Tu constancia de no adeudo fue aprobada", time: "Hace 2 horas", type: "success" as const },
  { id: 2, message: "Se requiere actualizar tu fotografía", time: "Hace 1 día", type: "warning" as const },
  { id: 3, message: "Nuevo lineamiento de titulación publicado", time: "Hace 3 días", type: "info" as const },
];

const initialDocuments = [
  { name: "Acta de Nacimiento", status: "approved", date: "15/03/2026" },
  { name: "Certificado de Estudios", status: "approved", date: "15/03/2026" },
  { name: "Constancia de No Adeudo de Colegiatura", status: "approved", date: "18/03/2026" },
  { name: "Liberación de Servicio Social", status: "approved", date: "20/03/2026" },
  { name: "Constancia de Prácticas Profesionales", status: "approved", date: "22/03/2026" },
  { name: "Fotografías Infantiles", status: "pending", date: "—" },
  { name: "Comprobante de Pago de Derechos", status: "pending", date: "—" },
  { name: "Acreditación de Idioma Inglés", status: "pending", date: "—" },
  { name: "No Adeudo de Laboratorio / Biblioteca", status: "pending", date: "—" },
  { name: "Solicitud de Examen Profesional", status: "pending", date: "—" },
  { name: "Oficio de Aprobación de Proyecto", status: "pending", date: "—" },
  { name: "Formato de Registro de Título", status: "pending", date: "—" },
];

const statusIcon = {
  approved: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  rejected: <AlertCircle className="w-4 h-4 text-rose-500" />,
};

const statusLabel = {
  approved: "Aprobado",
  pending: "Pendiente",
  rejected: "Rechazado",
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "requisitos">("overview");
  const [documents, setDocuments] = useState(initialDocuments);
  const [notifications, setNotifications] = useState(notificationsData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDirectorioOpen, setIsDirectorioOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const userEmail = localStorage.getItem("userEmail") || "correo@tesch.edu.mx";

  // Calculate dynamic metrics based on documents state
  const approvedCount = documents.filter((doc) => doc.status === "approved").length;
  const totalCount = documents.length;
  const pendingCount = totalCount - approvedCount;
  const progress = Math.round((approvedCount / totalCount) * 100);

  const handleNotificationRead = () => {
    setNotifications([]);
    toast({
      title: "Notificaciones",
      description: "Todas las notificaciones han sido marcadas como leídas.",
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      toast({
        title: "Archivo Seleccionado",
        description: `Subiendo "${fileName}"...`,
      });

      // Find first pending document to mock change
      setTimeout(() => {
        setDocuments(prev => {
          const index = prev.findIndex(doc => doc.status === "pending");
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              status: "approved",
              date: new Date().toLocaleDateString("es-MX")
            };
            return updated;
          }
          return prev;
        });

        toast({
          title: "Documento Subido",
          description: "Tu documento ha sido cargado con éxito para su validación.",
        });
      }, 1500);
    }
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Descarga Iniciada",
      description: "Descargando la guía completa de requisitos de titulación (PDF)...",
    });
  };

  const handleSidebarClick = (tab: "overview" | "documents" | "requisitos") => {
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
                <h4 className="text-[#efe1ca] font-semibold text-sm tracking-wide truncate">Estudiante SCA-ISC</h4>
                <p className="text-white/60 text-xs truncate mt-0.5">Ingeniería en Sistemas</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              onClick={() => handleSidebarClick("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "overview"
                  ? "bg-[#706147] text-white shadow-inner"
                  : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleSidebarClick("documents")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "documents"
                  ? "bg-[#706147] text-white shadow-inner"
                  : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
            >
              <FileText className="w-4 h-4" />
              <span>Expediente</span>
            </button>

            <button
              onClick={() => {
                toast({
                  title: "Horarios",
                  description: "La sección de horarios de asesorías estará disponible próximamente.",
                });
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              <span>Horarios</span>
            </button>

            <button
              onClick={() => {
                toast({
                  title: "Calificaciones",
                  description: "Las actas de evaluación profesional estarán disponibles al culminar tu dictamen.",
                });
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <Star className="w-4 h-4" />
              <span>Calificaciones</span>
            </button>

            <button
              onClick={() => {
                toast({
                  title: "Configuración",
                  description: "Configuración del perfil estudiantil disponible próximamente.",
                });
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
              <span>Configuración</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Log out */}
        <div className="p-4 border-t border-[#8a2036]/30">
          <Link
            to="/"
            onClick={() => {
              localStorage.removeItem("isAuthenticated");
              localStorage.removeItem("userEmail");
            }}
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
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#BC955B] rounded-full ring-1 ring-white"></span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-4 shadow-xl border-gray-100 rounded-xl overflow-hidden" align="end">
                <div className="p-4 bg-[#56212f] text-white flex items-center justify-between">
                  <span className="font-semibold text-sm">Notificaciones</span>
                  {notifications.length > 0 && (
                    <span className="bg-[#BC955B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {notifications.length} Nuevas
                    </span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2 space-y-1.5 bg-gray-50">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs font-medium">
                      No tienes notificaciones pendientes.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`bg-white border border-gray-100 rounded-lg p-3 flex items-start gap-2.5 shadow-sm`}>
                        {n.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> :
                          n.type === "warning" ? <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> :
                            <Bell className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] leading-snug text-gray-700 font-medium">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 bg-white border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNotificationRead}
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
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&auto=format&q=80"
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border-2 border-[#efe1ca] cursor-pointer hover:border-[#BC955B] transition-all"
                  title={userEmail}
                />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <span className="text-xs font-semibold text-gray-600 hidden lg:block tracking-wide max-w-[120px] truncate">
                {userEmail}
              </span>
            </div>
          </div>
        </header>

        {/* Primary Page Content Wrapper */}
        <main className="flex-1 p-6 md:p-8">

          {/* Sub-Navigation Tabs */}
          <div className="flex gap-8 border-b border-gray-200 mb-6">
            {(["overview", "documents", "requisitos"] as const).map((tab) => {
              const labels = {
                overview: "Resumen",
                documents: "Documentos",
                requisitos: "Requisitos"
              };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 font-semibold text-sm relative transition-all ${isActive ? "text-[#56212f]" : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {labels[tab]}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#56212f] rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Content */}
          <div className="space-y-6">

            {activeTab === "overview" && (
              <div className="space-y-6 animate-fade-in">

                {/* Progress Card (Matching styling of burgundy box) */}
                <div className="bg-[#56212f] text-white rounded-lg p-6 md:p-8 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg md:text-xl tracking-wide">Progreso de Titulación</h3>
                    <span className="text-[#BC955B] font-bold text-2xl md:text-3xl">{progress}%</span>
                  </div>

                  {/* Progress bar track & fill */}
                  <div className="w-full h-3 bg-[#3f1621] rounded-full overflow-hidden mb-5">
                    <div
                      className="h-full bg-[#BC955B] transition-all duration-700 ease-out rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="text-white/80 text-xs md:text-sm tracking-wide leading-relaxed font-light">
                    Has completado {approvedCount} de {totalCount} requisitos para tu proceso de titulación. Sigue avanzando para finalizar.
                  </p>
                </div>

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

                  <BracketCard>
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
                      <p className="text-xs text-gray-500 mt-1">Sube tus archivos oficiales en formato PDF para validación.</p>
                    </div>
                    <div>
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        id="document-upload"
                        accept=".pdf,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label htmlFor="document-upload">
                        <Button
                          asChild
                          className="bg-[#56212f] hover:bg-[#8a2036] text-white gap-2 font-semibold text-xs tracking-wider cursor-pointer"
                        >
                          <span>
                            <Upload className="w-3.5 h-3.5" /> SUBIR DOCUMENTO
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>

                  {/* Document Items List */}
                  <div className="divide-y divide-gray-100">
                    {documents.map((doc) => (
                      <div key={doc.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 hover:bg-gray-50/50 transition-colors gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <FileText className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-semibold text-gray-700 truncate">{doc.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Fecha de carga: {doc.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:self-center self-end">
                          <div className="flex items-center gap-1.5">
                            {statusIcon[doc.status as keyof typeof statusIcon]}
                            <Badge
                              className={`text-[10px] font-semibold px-2 py-0.5 border border-transparent tracking-wide ${doc.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  doc.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                            >
                              {statusLabel[doc.status as keyof typeof statusLabel]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </BracketCard>

              </div>
            )}

            {activeTab === "requisitos" && (
              <div className="animate-fade-in space-y-6">

                {/* Requirements info card */}
                <BracketCard className="space-y-6">
                  <div>
                    <h3 className="font-bold text-lg md:text-xl text-[#56212f] mb-2">Requisitos de Titulación</h3>
                    <p className="text-gray-500 text-xs md:text-sm leading-relaxed max-w-3xl">
                      A continuación se muestra el flujograma y los requisitos necesarios para iniciar tu proceso de titulación.
                      Puedes consultar esta información en cualquier momento.
                    </p>
                  </div>

                  {/* Flowcharts */}
                  <div className="flex flex-col gap-6 items-center justify-center w-full bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                    <img
                      src={reqImage1}
                      alt="Infografía de Requisitos Parte 1"
                      className="w-full max-w-4xl h-auto object-contain mx-auto rounded-lg shadow-sm border border-gray-100"
                    />
                    <img
                      src={reqImage2}
                      alt="Infografía de Requisitos Parte 2"
                      className="w-full max-w-4xl h-auto object-contain mx-auto rounded-lg shadow-sm border border-gray-100"
                    />
                  </div>

                  {/* Download button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleDownloadPDF}
                      className="bg-transparent hover:bg-gray-50 text-[#56212f] border border-[#56212f] hover:text-[#8a2036] font-semibold text-xs tracking-wider"
                      variant="outline"
                    >
                      Descargar PDF
                    </Button>
                  </div>
                </BracketCard>

              </div>
            )}

          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#56212f] text-white py-4 px-6 md:px-8 mt-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-xs border-t border-[#8a2036]/20">
          <p className="text-white/60">
            SCA-ISC &copy; 2024 TESCHA - Tecnológico de Estudios Superiores de Chalco.
          </p>
          <div className="flex gap-4 text-white/60">
            <a href="#" className="hover:text-[#efe1ca] transition-colors">Privacidad</a>
            <a href="#" className="hover:text-[#efe1ca] transition-colors">Términos de Uso</a>
            <a href="#" className="hover:text-[#efe1ca] transition-colors">Contacto</a>
          </div>
        </footer>

      </div>

      {/* Directory Dialog (Modal overlay) */}
      {isDirectorioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <BracketCard className="w-full max-w-lg bg-white relative animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsDirectorioOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-[#56212f] hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#56212f] flex items-center gap-2 border-b pb-2">
                <Contact className="w-5 h-5 text-[#BC955B]" />
                <span>Directorio del Proceso de Titulación</span>
              </h3>

              <p className="text-xs text-gray-500">
                Ponte en contacto con el personal encargado del departamento para cualquier duda sobre tus trámites.
              </p>

              <div className="space-y-3.5 mt-2">
                {/* Contact 1 */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#56212f]/10 text-[#56212f] flex items-center justify-center font-bold text-sm mt-0.5">
                    JE
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700">Jefatura de División (SCA-ISC)</h4>
                    <p className="text-[11px] text-gray-500">Ing. Elena Romero Flores</p>
                    <a href="mailto:sistemas@tesch.edu.mx" className="text-[11px] text-[#8a2036] hover:underline font-semibold block mt-0.5">
                      sistemas@tesch.edu.mx
                    </a>
                  </div>
                </div>

                {/* Contact 2 */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#56212f]/10 text-[#56212f] flex items-center justify-center font-bold text-sm mt-0.5">
                    CE
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700">Control Escolar (Trámites)</h4>
                    <p className="text-[11px] text-gray-500">Lic. Roberto Sánchez Pérez</p>
                    <a href="mailto:controlescolar@tesch.edu.mx" className="text-[11px] text-[#8a2036] hover:underline font-semibold block mt-0.5">
                      controlescolar@tesch.edu.mx
                    </a>
                  </div>
                </div>

                {/* Contact 3 */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#56212f]/10 text-[#56212f] flex items-center justify-center font-bold text-sm mt-0.5">
                    CJ
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-700">Caja y Finanzas (Pagos)</h4>
                    <p className="text-[11px] text-gray-500">Área de Tesorería General</p>
                    <a href="mailto:caja@tesch.edu.mx" className="text-[11px] text-[#8a2036] hover:underline font-semibold block mt-0.5">
                      caja@tesch.edu.mx
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  onClick={() => setIsDirectorioOpen(false)}
                  className="bg-[#56212f] hover:bg-[#8a2036] text-white font-semibold text-xs tracking-wider px-5"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </BracketCard>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
