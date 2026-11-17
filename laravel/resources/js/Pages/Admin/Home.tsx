import { Head } from "@inertiajs/react";
import { Users, FileText, ClipboardCheck, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLayout } from "@/components/admin/AdminLayout";
import type { AdminStats } from "@/types/admin";

const estatusLabel: Record<string, string> = {
  en_proceso: "En Proceso",
  en_revision: "En Revisión",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  completado: "Completado",
};

export default function AdminHome({ stats: s }: { stats: AdminStats }) {
  const barData = Object.entries(s.por_estatus).map(([key, count]) => ({
    name: estatusLabel[key] || key,
    count,
  }));

  const pieData = [
    { name: "Aprobados/Completados", value: (s.por_estatus.aprobado ?? 0) + (s.por_estatus.completado ?? 0), color: "#10B981" },
    { name: "En proceso/Revisión", value: (s.por_estatus.en_proceso ?? 0) + (s.por_estatus.en_revision ?? 0), color: "#F59E0B" },
    { name: "Rechazados", value: s.por_estatus.rechazado ?? 0, color: "#EF4444" },
  ];

  const cards = [
    { label: "Expedientes Activos", value: s.total_activos, icon: Users, box: "bg-gold-light", color: "text-navy" },
    { label: "Docs Pendientes", value: s.pendientes_revision, icon: FileText, box: "bg-amber-50", color: "text-amber-600" },
    { label: "Dictámenes Emitidos", value: s.dictamenes_emitidos, icon: ClipboardCheck, box: "bg-emerald-50", color: "text-emerald-600" },
    { label: "En Proceso", value: s.en_proceso, icon: Clock, box: "bg-blue-50", color: "text-blue-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      <Head title="Panel General" />
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Panel General</h1>
        <p className="text-muted-foreground font-body text-sm">Resumen del proceso de titulación ISC</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-muted-foreground font-body text-xs font-medium">{c.label}</p>
                  <p className="font-display text-3xl font-bold text-foreground mt-1">{c.value ?? 0}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${c.box} flex items-center justify-center`}>
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
}

AdminHome.layout = adminLayout;
