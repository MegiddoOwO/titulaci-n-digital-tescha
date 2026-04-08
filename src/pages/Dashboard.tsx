import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Bell, BookOpen, CheckCircle2, Clock, AlertCircle,
  Upload, User, LogOut, ChevronRight, BarChart3, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import logo from "@/assets/tescha-logo.png";

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
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "notifications">("overview");
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
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground/50 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
            Bienvenido, Juan
          </h1>
          <p className="text-muted-foreground font-body">
            Aquí puedes consultar el avance de tu proceso de titulación.
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-primary rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-primary-foreground font-body font-semibold">Progreso General</h3>
              <p className="text-primary-foreground/60 font-body text-sm">3 de 5 etapas completadas</p>
            </div>
            <span className="text-accent font-display text-2xl font-bold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-primary-foreground/10" />
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
                <Button variant="outline" className="w-full justify-between h-11 font-body">
                  <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Subir Documento</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between h-11 font-body">
                  <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> Ver Normativa</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="w-full justify-between h-11 font-body">
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
                    <Badge variant={doc.status === "approved" ? "default" : "secondary"} className="font-body text-xs">
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
      </div>
    </div>
  );
};

export default Dashboard;
