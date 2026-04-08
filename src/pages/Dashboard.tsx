import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Bell, BookOpen, CheckCircle2, Clock, AlertCircle,
  Upload, User, LogOut, ChevronRight, BarChart3, FileCheck, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import logo from "@/assets/tescha-logo.svg";
import reqImage1 from "@/assets/TITULO26_1_001.png";
import reqImage2 from "@/assets/TITULO26_2_001.png";

const statusSteps = [
  { label: "Registro", status: "completed" as const },
  { label: "Documentación", status: "completed" as const },
  { label: "Validación", status: "current" as const },
  { label: "Revisión", status: "pending" as const },
  { label: "Dictamen", status: "pending" as const },
];

const notifications = [
  { id: 1, message: "Tu constancia de no adeudo fue aprobada", time: "Hace 2 horas", type: "success" as const },
  { id: 2, message: "Se requiere actualizar tu fotografía", time: "Hace 1 día", type: "warning" as const },
  { id: 3, message: "Nuevo lineamiento de titulación publicado", time: "Hace 3 días", type: "info" as const },
];

const documents = [
  { name: "Acta de Nacimiento", status: "approved", date: "15/03/2026" },
  { name: "Certificado de Estudios", status: "approved", date: "15/03/2026" },
  { name: "Constancia de No Adeudo", status: "approved", date: "18/03/2026" },
  { name: "Fotografías", status: "pending", date: "—" },
  { name: "Comprobante de Pago", status: "pending", date: "—" },
];

const statusIcon = {
  approved: <CheckCircle2 className="w-4 h-4 text-success" />,
  pending: <Clock className="w-4 h-4 text-warning" />,
  rejected: <AlertCircle className="w-4 h-4 text-destructive" />,
};

const statusLabel = {
  approved: "Aprobado",
  pending: "Pendiente",
  rejected: "Rechazado",
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "requisitos" | "notifications">("overview");
  const progress = 60;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="bg-primary border-b border-primary sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="TESCHA" className="h-8 w-8" />
            <span className="text-primary-foreground font-body text-sm font-semibold hidden sm:block">
              Sistema de Titulación ISC
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent rounded-full text-[8px] flex items-center justify-center text-accent-foreground font-bold">3</span>
            </Button>
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
              <span className="font-body text-sm hidden sm:block">Juan Pérez</span>
            </div>
            <Link to="/" onClick={() => localStorage.removeItem("isAuthenticated")}>
              <Button variant="ghost" size="sm" className="text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8 p-8 rounded-2xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm relative overflow-hidden">
          {/* Decorative glow element */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-navy mb-2 drop-shadow-sm">
              Bienvenido, <span className="text-accent">Juan</span>
            </h1>
            <p className="text-muted-foreground font-body text-lg tracking-wide">
              Panel de seguimiento para tu proceso de titulación.
            </p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-primary rounded-xl p-8 mb-8 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-primary-foreground font-body text-lg font-semibold tracking-wide">Progreso General</h3>
              <p className="text-primary-foreground/70 font-body text-sm mt-1">3 de 5 etapas completadas</p>
            </div>
            <span className="text-accent font-display text-3xl font-bold drop-shadow-md">{progress}%</span>
          </div>
          
          {/* Custom Progress Bar to contrast with primary background */}
          <div className="w-full h-2.5 bg-primary-foreground/10 rounded-full overflow-hidden mb-8">
            <div 
              className="h-full bg-accent transition-all duration-500 ease-in-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-4">
            {statusSteps.map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.status === "completed" ? "bg-accent text-accent-foreground" :
                  step.status === "current" ? "bg-primary-foreground text-primary ring-2 ring-accent" :
                  "bg-primary-foreground/20 text-primary-foreground/50"
                }`}>
                  {step.status === "completed" ? "✓" : i + 1}
                </div>
                <span className={`font-body text-xs hidden sm:block ${
                  step.status === "current" ? "text-accent font-semibold" : "text-primary-foreground/50"
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
          {([
            { key: "overview", icon: BarChart3, label: "Resumen" },
            { key: "documents", icon: FileText, label: "Documentos" },
            { key: "requisitos", icon: ClipboardList, label: "Requisitos" },
            { key: "notifications", icon: Bell, label: "Notificaciones" },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md font-body text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Estado Actual</h3>
              <div className="flex items-center gap-3 bg-gold-light rounded-lg p-4">
                <Clock className="w-8 h-8 text-navy" />
                <div>
                  <p className="font-body font-semibold text-foreground">En Validación</p>
                  <p className="font-body text-sm text-muted-foreground">Tus documentos están siendo revisados por el departamento escolar.</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-11 font-body"
                  onClick={() => setActiveTab("documents")}
                >
                  <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Subir Documento</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Link to="/normativa" className="block w-full">
                  <Button variant="outline" className="w-full justify-between h-11 font-body">
                    <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Ver Normativa</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-11 font-body"
                  onClick={() => {
                    import("sonner").then(({ toast }) => {
                      toast.info("Próximamente", { description: "El portal de pagos en línea se habilitará pronto." })
                    });
                  }}
                >
                  <span className="flex items-center gap-2"><FileCheck className="w-4 h-4" /> Pago de Derechos</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="bg-card border border-border rounded-lg overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-foreground">Documentos Requeridos</h3>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-navy-light gap-2 font-body">
                <Upload className="w-3.5 h-3.5" /> Subir
              </Button>
            </div>
            <div className="divide-y divide-border">
              {documents.map((doc) => (
                <div key={doc.name} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{doc.name}</p>
                      <p className="font-body text-xs text-muted-foreground">{doc.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon[doc.status as keyof typeof statusIcon]}
                    <Badge 
                      className={`font-body text-xs border-transparent text-white ${
                        doc.status === "approved" ? "bg-success hover:bg-success/80" : 
                        doc.status === "pending" ? "bg-destructive hover:bg-destructive/80" : 
                        "bg-muted-foreground"
                      }`}
                    >
                      {statusLabel[doc.status as keyof typeof statusLabel]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-3 animate-fade-in">
            {notifications.map((n) => (
              <div key={n.id} className={`bg-card border rounded-lg p-4 flex items-start gap-3 ${
                n.type === "success" ? "border-success/30" :
                n.type === "warning" ? "border-warning/30" : "border-info/30"
              }`}>
                {n.type === "success" ? <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" /> :
                 n.type === "warning" ? <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" /> :
                 <Bell className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className="font-body text-sm text-foreground">{n.message}</p>
                  <p className="font-body text-xs text-muted-foreground mt-1">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "requisitos" && (
          <div className="bg-card border border-border rounded-lg p-6 animate-fade-in overflow-hidden shadow-sm">
            <h3 className="font-display text-2xl font-semibold text-navy mb-4">Requisitos de Titulación</h3>
            <p className="text-muted-foreground font-body mb-6">
              A continuación se muestra el flujograma y los requisitos necesarios para iniciar tu proceso de titulación.
              Puedes consultar esta información en cualquier momento.
            </p>
            <div className="flex flex-col gap-6 items-center justify-center w-full">
              <img 
                src={reqImage1} 
                alt="Infografía de Requisitos Parte 1" 
                className="w-full max-w-4xl h-auto object-contain mx-auto rounded-lg shadow-md border border-border" 
              />
              <img 
                src={reqImage2} 
                alt="Infografía de Requisitos Parte 2" 
                className="w-full max-w-4xl h-auto object-contain mx-auto rounded-lg shadow-md border border-border" 
              />
            </div>
            <div className="mt-6 flex justify-end">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90" variant="outline">
                    Descargar PDF
                </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
