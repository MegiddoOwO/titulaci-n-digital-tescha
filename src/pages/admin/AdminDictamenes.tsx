import { useState } from "react";
import { ClipboardCheck, Send, FileText, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const candidates = [
  { id: "EXP-001", name: "María García López", modalidad: "Tesis", docsComplete: true },
  { id: "EXP-005", name: "Rosa Jiménez Castro", modalidad: "Promedio", docsComplete: true },
];

const emitted = [
  { id: "DICT-001", student: "Fernando Reyes", result: "Aprobado", date: "28/03/2026", modalidad: "EGEL" },
  { id: "DICT-002", student: "Lucía Morales", result: "Aprobado", date: "25/03/2026", modalidad: "Tesis" },
  { id: "DICT-003", student: "Jorge Vázquez", result: "Condicionado", date: "20/03/2026", modalidad: "Residencia" },
];

const AdminDictamenes = () => {
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [result, setResult] = useState("");
  const [observations, setObservations] = useState("");
  const { toast } = useToast();

  const handleEmit = () => {
    if (!selectedCandidate || !result) return;
    toast({ title: "Dictamen emitido", description: "El dictamen ha sido registrado y notificado al egresado." });
    setSelectedCandidate("");
    setResult("");
    setObservations("");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dictámenes</h1>
        <p className="text-muted-foreground font-body text-sm">Emite y consulta dictámenes de titulación</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Emit */}
        <Card className="border-accent/30">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-accent" /> Emitir Dictamen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Egresado</label>
              <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Seleccionar egresado..." />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-body">
                      {c.name} — {c.modalidad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Resultado</label>
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Seleccionar resultado..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprobado" className="font-body">Aprobado</SelectItem>
                  <SelectItem value="condicionado" className="font-body">Condicionado</SelectItem>
                  <SelectItem value="no_aprobado" className="font-body">No aprobado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-1.5 block">Observaciones</label>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Escriba las observaciones del dictamen..."
                className="font-body text-sm min-h-[100px]"
              />
            </div>
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-navy-light gap-2 font-body"
              onClick={handleEmit}
              disabled={!selectedCandidate || !result}
            >
              <Send className="w-4 h-4" /> Emitir Dictamen
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" /> Dictámenes Emitidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emitted.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${d.result === "Aprobado" ? "text-success" : "text-warning"}`} />
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{d.student}</p>
                      <p className="font-body text-xs text-muted-foreground">{d.modalidad} · {d.date}</p>
                    </div>
                  </div>
                  <Badge variant={d.result === "Aprobado" ? "default" : "secondary"} className="font-body text-[10px]">
                    {d.result}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDictamenes;
