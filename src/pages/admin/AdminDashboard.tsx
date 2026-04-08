import { Users, FileText, ClipboardCheck, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const stats = [
  { label: "Expedientes Activos", value: "47", icon: Users, change: "+5 este mes" },
  { label: "Documentos Pendientes", value: "23", icon: FileText, change: "12 urgentes" },
  { label: "Dictámenes Emitidos", value: "18", icon: ClipboardCheck, change: "+3 esta semana" },
  { label: "En Proceso", value: "29", icon: Clock, change: "Promedio: 15 días" },
];

const recentActivity = [
  { student: "María García López", action: "Subió Acta de Nacimiento", time: "Hace 20 min", status: "pending" },
  { student: "Carlos Hernández Ruiz", action: "Documentación completa", time: "Hace 1 hora", status: "review" },
  { student: "Ana Martínez Torres", action: "Dictamen aprobado", time: "Hace 2 horas", status: "approved" },
  { student: "Luis Sánchez Pérez", action: "Comprobante de pago rechazado", time: "Hace 3 horas", status: "rejected" },
  { student: "Rosa Jiménez Castro", action: "Registro en plataforma", time: "Hace 5 horas", status: "new" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  review: { label: "En revisión", variant: "outline" },
  approved: { label: "Aprobado", variant: "default" },
  rejected: { label: "Rechazado", variant: "destructive" },
  new: { label: "Nuevo", variant: "secondary" },
};

const AdminDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Panel General</h1>
        <p className="text-muted-foreground font-body text-sm">Resumen del proceso de titulación ISC</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground font-body text-xs font-medium">{stat.label}</p>
                  <p className="font-display text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-muted-foreground font-body text-[11px] mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />{stat.change}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-gold-light flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-navy" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 divide-y divide-border">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="font-body text-xs font-semibold text-foreground">
                        {item.student.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-body text-sm font-medium text-foreground truncate">{item.student}</p>
                      <p className="font-body text-xs text-muted-foreground">{item.action} · {item.time}</p>
                    </div>
                  </div>
                  <Badge variant={statusConfig[item.status].variant} className="font-body text-[10px] flex-shrink-0 ml-2">
                    {statusConfig[item.status].label}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Avance por Etapa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Registro", value: 95 },
              { label: "Documentación", value: 72 },
              { label: "Validación", value: 55 },
              { label: "Revisión", value: 38 },
              { label: "Dictamen", value: 20 },
            ].map((stage) => (
              <div key={stage.label}>
                <div className="flex justify-between mb-1">
                  <span className="font-body text-xs font-medium text-foreground">{stage.label}</span>
                  <span className="font-body text-xs text-muted-foreground">{stage.value}%</span>
                </div>
                <Progress value={stage.value} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
