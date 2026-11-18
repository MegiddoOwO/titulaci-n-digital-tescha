import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { adminLayout } from "@/components/admin/AdminLayout";
import type { ExpedienteItem } from "@/types/admin";

export default function AdminDictamenes({ candidatos }: { candidatos: ExpedienteItem[] }) {
  const [tramiteId, setTramiteId] = useState("");
  const [resultado, setResultado] = useState("aprobado");
  const [observaciones, setObservaciones] = useState("");
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const handleEmitir = () => {
    if (!tramiteId) return;
    router.post(
      "/admin/dictamenes",
      { tramite_id: parseInt(tramiteId), resultado, observaciones: observaciones.trim() },
      {
        preserveScroll: true,
        onStart: () => setPending(true),
        onFinish: () => setPending(false),
        onSuccess: () => {
          toast({ title: "Dictamen emitido", description: "El dictamen ha sido registrado correctamente." });
          setTramiteId("");
          setObservaciones("");
        },
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <Head title="Dictámenes" />
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
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!tramiteId || pending}
              onClick={handleEmitir}
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ClipboardCheck className="w-4 h-4 mr-2" />}
              Emitir Dictamen
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">Expedientes disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {candidatos.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setTramiteId(String(c.id))}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    tramiteId === String(c.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
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
                        c.color_semaforo === "verde" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {c.porcentaje}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={c.porcentaje} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

AdminDictamenes.layout = adminLayout;
