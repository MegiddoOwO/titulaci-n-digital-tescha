import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminLayout } from "@/components/admin/AdminLayout";
import { RechazoModal } from "@/components/admin/RechazoModal";
import { ExpedienteDocumentos } from "@/components/admin/ExpedienteDocumentos";
import { reviewDocumento } from "@/components/admin/useExpedienteDetalle";
import type { ExpedienteDetalle } from "@/types/admin";

// Full-page variant of the expediente detail (the list opens it as a dialog, as the legacy app did).
export default function AdminExpedienteShow({ tramite }: { tramite: ExpedienteDetalle }) {
  const [pending, setPending] = useState(false);
  const [rechazarDocId, setRechazarDocId] = useState<number | null>(null);

  const review = (docId: number, action: "aprobar" | "rechazar", data: Record<string, string> = {}) =>
    reviewDocumento(docId, action, data, {
      onStart: () => setPending(true),
      onFinish: () => setPending(false),
      onSuccess: () => setRechazarDocId(null),
    });

  return (
    <div className="p-6 space-y-6">
      <Head title={`Expediente ${tramite.id}`} />
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Expediente {tramite.id}
          <span className="ml-2 text-sm text-muted-foreground font-normal">— {tramite.opcion_titulacion}</span>
        </h1>
        <p className="text-muted-foreground font-body text-sm">
          {tramite.titulo_proyecto || "Sin título de proyecto"} ·{" "}
          <Link href="/admin/expedientes" className="text-navy hover:underline">Volver a expedientes</Link>
        </p>
      </div>
      <Card className="border-border max-w-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpedienteDocumentos
            detalle={tramite}
            loading={false}
            pending={pending}
            onApprove={(id) => review(id, "aprobar")}
            onReject={setRechazarDocId}
          />
        </CardContent>
      </Card>
      {rechazarDocId !== null && (
        <RechazoModal
          pending={pending}
          onCancel={() => setRechazarDocId(null)}
          onConfirm={(motivo) => review(rechazarDocId, "rechazar", { motivo })}
        />
      )}
    </div>
  );
}

AdminExpedienteShow.layout = adminLayout;
