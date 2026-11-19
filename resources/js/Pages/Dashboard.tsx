import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Contact, Gavel, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { estudianteLayout } from "@/components/estudiante/EstudianteLayout";
import { TramiteSummary } from "@/components/estudiante/TramiteSummary";
import { DocumentList } from "@/components/estudiante/DocumentList";
import { DictamenPanel } from "@/components/estudiante/DictamenPanel";
import { HistorialTimeline } from "@/components/estudiante/HistorialTimeline";
import { RequisitosPanel } from "@/components/estudiante/RequisitosPanel";
import { AsesoresPanel } from "@/components/estudiante/AsesoresPanel";
import { DirectorioDialog } from "@/components/estudiante/DirectorioDialog";
import { ArcoDialog } from "@/components/estudiante/ArcoDialog";
import { useUploadDocumento } from "@/components/estudiante/useUploadDocumento";
import type { PageProps } from "@/types";
import type { HistorialEntry, TramiteData } from "@/types/tramite";

type Props = {
  tramite: TramiteData | null;
  error: string | null;
  historial?: HistorialEntry[];
};

type Seccion = "documentos" | "requisitos" | "asesores";

const SECCIONES = [
  { value: "documentos" as const, label: "Documentos" },
  { value: "requisitos" as const, label: "Requisitos" },
  { value: "asesores" as const, label: "Asesores" },
];

/** Directorio, privacy (ARCO) and normativa: always reachable, with or without a trámite. */
function Ayuda({ onDirectorio, onArco }: { onDirectorio: () => void; onArco: () => void }) {
  return (
    <section aria-labelledby="ayuda-titulo" className="grid gap-2 rounded-lg border bg-card p-4">
      <h2 id="ayuda-titulo" className="text-sm font-extrabold">
        Ayuda y privacidad
      </h2>
      <Button type="button" variant="outline" className="justify-start" onClick={onDirectorio}>
        <Contact aria-hidden="true" />
        Directorio institucional
      </Button>
      <Button type="button" variant="outline" className="justify-start" onClick={onArco}>
        <Shield aria-hidden="true" />
        Solicitud de derechos ARCO
      </Button>
      <Button asChild variant="outline" className="justify-start">
        <Link href="/normativa">
          <Gavel aria-hidden="true" />
          Normativa de titulación
        </Link>
      </Button>
    </section>
  );
}

export default function Dashboard({ tramite, error, historial }: PageProps<Props>) {
  const [seccion, setSeccion] = useState<Seccion>("documentos");
  const [directorioOpen, setDirectorioOpen] = useState(false);
  const [arcoOpen, setArcoOpen] = useState(false);
  const upload = useUploadDocumento(tramite?.id ?? 0);

  const ayuda = <Ayuda onDirectorio={() => setDirectorioOpen(true)} onArco={() => setArcoOpen(true)} />;
  const dialogs = (
    <>
      <DirectorioDialog open={directorioOpen} onOpenChange={setDirectorioOpen} />
      <ArcoDialog open={arcoOpen} onOpenChange={setArcoOpen} />
    </>
  );

  if (!tramite) {
    return (
      <div className="mx-auto grid max-w-[640px] gap-4 px-4 py-6 sm:px-8">
        <Head title="Mi trámite" />
        <h1 className="text-2xl font-extrabold">Mi trámite</h1>
        <section className="rounded-lg border bg-card px-4 py-6">
          <h2 className="text-sm font-extrabold">Sin trámite activo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {error ?? "No se encontró un trámite de titulación activo."} Contacta a Control Escolar para que lo registren.
          </p>
        </section>
        {ayuda}
        {dialogs}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-8">
      <Head title="Mi trámite" />

      <div className="mb-4">
        <h1 className="text-2xl font-extrabold">Mi trámite</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {tramite.opcion_titulacion}
          {tramite.titulo_proyecto ? ` · ${tramite.titulo_proyecto}` : ""}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="grid min-w-0 gap-4">
          <TramiteSummary tramite={tramite} state={upload} />
          <DictamenPanel dictamen={tramite.dictamen} />

          <SegmentedControl options={SECCIONES} value={seccion} onChange={setSeccion} label="Secciones de tu trámite" />

          {seccion === "documentos" && <DocumentList documentos={tramite.documentos} tramiteId={tramite.id} state={upload} />}
          {seccion === "requisitos" && <RequisitosPanel documentos={tramite.documentos} opcion={tramite.opcion_titulacion} />}
          {seccion === "asesores" && <AsesoresPanel asignaciones={tramite.asignaciones} opcion={tramite.opcion_titulacion} />}
        </div>

        <div className="grid min-w-0 gap-4">
          <HistorialTimeline historial={historial} />
          {ayuda}
        </div>
      </div>
      {dialogs}
    </div>
  );
}

Dashboard.layout = estudianteLayout;
