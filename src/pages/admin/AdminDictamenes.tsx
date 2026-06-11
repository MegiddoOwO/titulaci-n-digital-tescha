import { useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";

const AdminDictamenes = () => {
  const [tramiteId, setTramiteId] = useState<string>("");
  const [resultado, setResultado] = useState<string>("aprobado");
  const [observaciones, setObservaciones] = useState("");
  const { listarExpedientes, emitirDictamen } = useAdmin();
  const { toast } = useToast();

  const { data, isLoading } = listarExpedientes({ page: 1 });

  const candidatos = data?.expedientes.filter(
    (e) => e.estatus === "aprobado" || e.estatus === "en_revision"
  ) || [];

  const handleEmitir = () => {
    if (!tramiteId) return;
    emitirDictamen.mutate(
      {
        tramite_id: parseInt(tramiteId),
        resultado: resultado as "aprobado" | "rechazado",
        observaciones: observaciones.trim(),
      },
      {
        onSuccess: () => {
          toast({ title: "Dictamen emitido", description: "El dictamen ha sido registrado correctamente." });
          setTramiteId("");
          setObservaciones("");
        },
        onError: (err: Error) => {
          toast({ title: "Error", description: err.message, className: "bg-destructive text-destructive-foreground" });
        },
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dictámenes</h1>
        <p className="text-muted-foreground font-body text-sm">Emite dictámenes oficiales de titulación</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Emitir Dictamen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Selecciona el trámite</label>
              <Select value={tramiteId} onValueChange={setTramiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige un trámite aprobado/en revisión..." />
                </SelectTrigger>
                <SelectContent>
                  {candidatos.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.numero_control} — {c.nombre_completo} ({c.porcentaje}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Resultado</label>
              <Select value={resultado} onValueChange={setResultado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">Observaciones</label>
              <Textarea
                placeholder="Observaciones del dictamen..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              className="w-full bg-navy text-white hover:bg-navy/90"
              disabled={!tramiteId || emitirDictamen.isPending}
              onClick={handleEmitir}
            >
              {emitirDictamen.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ClipboardCheck className="w-4 h-4 mr-2" />
              )}
              Emitir Dictamen
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Expedientes disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {candidatos.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setTramiteId(String(c.id))}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      tramiteId === String(c.id)
                        ? "border-navy bg-navy/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">{c.nombre_completo}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {c.numero_control} · {c.opcion_titulacion}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-[10px] ${
                          c.color_semaforo === "verde" ? "bg-emerald-100 text-emerald-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {c.porcentaje}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={c.porcentaje} className="h-1 mt-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDictamenes;
