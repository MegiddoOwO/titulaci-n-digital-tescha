import { Users, FileText, ClipboardCheck, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdmin } from "@/hooks/useAdmin";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

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

  const barData = s ? Object.entries(s.por_estatus).map(([key, count]) => ({
    name: estatusLabel[key] || key,
    count,
  })) : [];

  const pieData = s ? [
    { name: "Aprobados/Completados", value: (s.por_estatus.aprobado ?? 0) + (s.por_estatus.completado ?? 0), color: "#10B981" },
    { name: "En proceso/Revisión", value: (s.por_estatus.en_proceso ?? 0) + (s.por_estatus.en_revision ?? 0), color: "#F59E0B" },
    { name: "Rechazados", value: s.por_estatus.rechazado ?? 0, color: "#EF4444" },
  ] : [];

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
          <CardHeader className="pb-1">
            <CardTitle className="font-display text-lg">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={["#F59E0B", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"][i] || "#6B7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-1">
            <CardTitle className="font-display text-lg">Resumen General</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
