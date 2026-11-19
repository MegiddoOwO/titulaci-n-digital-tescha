import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { jsonRequest } from "@/lib/http";

const TIPOS = [
  { value: "acceso", label: "Acceso a mis datos" },
  { value: "rectificacion", label: "Rectificación de datos" },
  { value: "cancelacion", label: "Cancelación / Eliminación" },
  { value: "oposicion", label: "Oposición al tratamiento" },
];

function ArcoForm({ onClose }: { onClose: () => void }) {
  const [tipo, setTipo] = useState("acceso");
  const [detalle, setDetalle] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await jsonRequest<{ message: string }>("/solicitudes-arco", "POST", { tipo, detalle: detalle.trim() });
      setEnviado(true);
      toast({ title: "Solicitud enviada", description: data.message });
    } catch (err: unknown) {
      const message = (err as Error).message;
      setError(message);
      toast({ title: "Error", description: message, className: "bg-destructive text-destructive-foreground" });
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div role="status" className="grid gap-3 py-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-state-green" aria-hidden="true" />
          Solicitud enviada correctamente
        </p>
        <p className="text-sm text-muted-foreground">Será procesada en un máximo de 15 días hábiles.</p>
        <Button type="button" onClick={onClose} className="w-full sm:w-auto sm:justify-self-end">
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="arco-tipo">Tipo de solicitud</Label>
        <select
          id="arco-tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="arco-detalle">Detalle (opcional)</Label>
        <Textarea
          id="arco-detalle"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder="Describe los datos que deseas acceder, rectificar, cancelar o a los que te opones"
          className="min-h-[96px] resize-y"
        />
      </div>

      <p className="rounded-md border bg-muted px-3 py-2.5 text-sm">
        <span className="font-extrabold">Plazo legal: </span>por ley, tu solicitud debe ser respondida en un máximo de 15 días hábiles.
      </p>

      {error && (
        <p role="alert" className="text-sm font-semibold text-state-red">
          No se pudo enviar la solicitud: {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Enviando…" : "Enviar solicitud ARCO"}
      </Button>
    </form>
  );
}

export function ArcoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitud de derechos ARCO</DialogTitle>
          <DialogDescription>
            Ejerce tus derechos de Acceso, Rectificación, Cancelación u Oposición sobre tus datos personales.
          </DialogDescription>
        </DialogHeader>
        <ArcoForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
