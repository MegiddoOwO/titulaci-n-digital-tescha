import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Reason prompt shared by every document rejection (a real dialog: focus trap, Escape, labelled). */
export function RechazoModal({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: boolean;
  onCancel: () => void;
  onConfirm: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>Motivo del rechazo</DialogTitle>
          <DialogDescription>El estudiante verá este motivo para corregir y volver a subir el documento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <label htmlFor="motivo-rechazo" className="sr-only">Motivo del rechazo</label>
          <Textarea
            id="motivo-rechazo"
            placeholder="Describe por qué se rechaza este documento..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
            <Button size="sm" variant="destructive" disabled={!motivo.trim() || pending} onClick={() => onConfirm(motivo.trim())}>
              {pending ? "Rechazando..." : "Confirmar rechazo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
