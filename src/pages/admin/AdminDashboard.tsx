import { Users, FileText, ClipboardCheck, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAdmin } from "@/hooks/useAdmin";

const estatusLabel: Record<string, string> = {
  en_proceso: "En Proceso",
  en_revision: "En Revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  completado: "Completado",
};

const AdminDashboard = () => {
  const { stats } = useAdmin();

  if (stats.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    );
  }

  const s = stats.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Panel General</h1>
        <p className="text-muted-foreground font-body text-sm">Resumen del proceso de titulación ISC</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground font-body text-xs font-medium">Expedientes Activos</p>
                <p className="font-display text-3xl font-bold text-foreground mt-1">{s?.total_activos ?? 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gold-light flex items-center justify-center">
                <Users className="w-5 h-5 text-navy" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground font-body text-xs font-medium">Docs Pendientes</p>
                <p className="font-display text-3xl font-bold text-foreground mt-1">{s?.pendientes_revision ?? 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground font-body text-xs font-medium">Dictámenes Emitidos</p>
                <p className="font-display text-3xl font-bold text-foreground mt-1">{s?.dictamenes_emitidos ?? 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground font-body text-xs font-medium">En Proceso</p>
                <p className="font-display text-3xl font-bold text-foreground mt-1">{s?.en_proceso ?? 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {s && Object.entries(s.por_estatus).map(([key, count]) => (
              <div key={key}>
                <div className="flex justify-between mb-1">
                  <span className="font-body text-xs font-medium text-foreground flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        key === "aprobado" || key === "completado" ? "border-emerald-200 text-emerald-700" :
                        key === "rechazado" ? "border-rose-200 text-rose-700" :
                        "border-amber-200 text-amber-700"
                      }`}
                    >
                      {estatusLabel[key] || key}
                    </Badge>
                  </span>
                  <span className="font-body text-xs text-muted-foreground">{count}</span>
                </div>
                <Progress value={s.total_activos > 0 ? (count / s.total_activos) * 100 : 0} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-emerald-50 rounded-lg flex items-center justify-between">
              <span className="font-body text-sm font-medium text-emerald-800">Expedientes aprobados/completados</span>
              <span className="font-display text-xl font-bold text-emerald-700">{(s?.por_estatus.aprobado ?? 0) + (s?.por_estatus.completado ?? 0)}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg flex items-center justify-between">
              <span className="font-body text-sm font-medium text-amber-800">En revisión / proceso</span>
              <span className="font-display text-xl font-bold text-amber-700">{(s?.por_estatus.en_proceso ?? 0) + (s?.por_estatus.en_revision ?? 0)}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg flex items-center justify-between">
              <span className="font-body text-sm font-medium text-rose-800">Rechazados</span>
              <span className="font-display text-xl font-bold text-rose-700">{s?.por_estatus.rechazado ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
