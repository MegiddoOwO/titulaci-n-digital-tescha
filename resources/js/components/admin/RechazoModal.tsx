import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-base">Motivo del rechazo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
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
        </CardContent>
      </Card>
    </div>
  );
}
