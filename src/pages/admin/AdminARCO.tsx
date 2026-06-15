import { useState, useEffect } from "react";
import { Loader2, Shield, CheckCircle2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getToken } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface SolicitudArco {
  id: number;
  tipo: string;
  estado: string;
  detalle_solicitud: string | null;
  respuesta: string | null;
  fecha_solicitud: string;
  fecha_resolucion: string | null;
  numero_control: string;
  nombre_completo: string;
}

const AdminARCO = () => {
  const { toast } = useToast();
  const [solicitudes, setSolicitudes] = useState<SolicitudArco[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SolicitudArco | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/solicitudes-arco", { headers: { Authorization: `Bearer ${getToken()}` } });
      setSolicitudes(await res.json());
    } catch { /* */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchSolicitudes(); }, []);

  const handleResolve = async (id: number, estado: "resuelta" | "rechazada") => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/solicitudes-arco/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ estado, respuesta: respuesta.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: data.message });
      setSelected(null); setRespuesta("");
      fetchSolicitudes();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Solicitudes ARCO</h1>
        <p className="text-muted-foreground font-body text-sm">Gestiona las solicitudes de datos personales (LGPDPPSO)</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              Solicitudes ({solicitudes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : solicitudes.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No hay solicitudes ARCO pendientes.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Solicitante</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Fecha</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudes.map(s => (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(s)}>
                      <TableCell className="text-sm">
                        <p className="font-medium">{s.nombre_completo}</p>
                        <p className="text-[10px] text-muted-foreground">{s.numero_control}</p>
                      </TableCell>
                      <TableCell className="text-xs">{s.tipo}</TableCell>
                      <TableCell className="text-xs">{new Date(s.fecha_solicitud).toLocaleDateString("es-MX")}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${
                          s.estado === "pendiente" ? "bg-amber-100 text-amber-700" :
                          s.estado === "resuelta" ? "bg-emerald-100 text-emerald-700" :
                          s.estado === "rechazada" ? "bg-rose-100 text-rose-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {s.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              {selected ? "Procesar solicitud" : "Selecciona una solicitud"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Selecciona una solicitud para procesarla.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Solicitante</p>
                  <p className="text-sm font-medium">{selected.nombre_completo} ({selected.numero_control})</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <Badge className="text-[10px]">{selected.tipo}</Badge>
                </div>
                {selected.detalle_solicitud && (
                  <div>
                    <p className="text-xs text-muted-foreground">Detalle</p>
                    <p className="text-sm border rounded p-2 bg-muted/30">{selected.detalle_solicitud}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Respuesta</p>
                  <Textarea
                    value={respuesta}
                    onChange={e => setRespuesta(e.target.value)}
                    placeholder="Escribe la respuesta para el solicitante..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm" variant="outline" className="flex-1 gap-1"
                    disabled={!selected || saving}
                    onClick={() => handleResolve(selected.id, "resuelta")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Resolver
                  </Button>
                  <Button
                    size="sm" variant="outline" className="flex-1 gap-1"
                    disabled={!selected || saving}
                    onClick={() => handleResolve(selected.id, "rechazada")}
                  >
                    <Ban className="w-3.5 h-3.5 text-rose-500" /> Rechazar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminARCO;
