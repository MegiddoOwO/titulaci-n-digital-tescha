import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
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
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-4 px-4 py-6 sm:px-8">
      <Head title={`Expediente ${tramite.id}`} />
      <div>
        <Link
          href="/admin/expedientes"
          className="inline-flex items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Volver a expedientes
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold">
          Expediente <span className="tnum">{tramite.id}</span>
          <span className="ml-2 text-sm font-normal text-muted-foreground">{tramite.opcion_titulacion}</span>
        </h1>
        <p className="text-sm text-muted-foreground">{tramite.titulo_proyecto || "Sin título de proyecto"}</p>
      </div>
      <section className="max-w-3xl min-w-0 rounded-lg border bg-card p-4 text-card-foreground" aria-labelledby="documentos-titulo">
        <h2 id="documentos-titulo" className="mb-3 text-base font-extrabold">Documentos</h2>
        <ExpedienteDocumentos
          detalle={tramite}
          loading={false}
          pending={pending}
          showFormat
          onApprove={(id) => review(id, "aprobar")}
          onReject={setRechazarDocId}
        />
      </section>
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
