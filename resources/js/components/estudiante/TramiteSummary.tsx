import { Progress } from "@/components/ui/progress";
import { LampHousing, toLampState } from "@/components/ui/lamp";
import { estatusLabel } from "@/components/ui/status-badge";
import { UploadControl } from "@/components/estudiante/UploadControl";
import { proximoDocumento, siguientePaso } from "@/components/estudiante/helpers";
import type { UploadState } from "@/components/estudiante/useUploadDocumento";
import type { TramiteData } from "@/types/tramite";

const SEMAFORO_TEXTO = { verde: "Sin pendientes", ambar: "Con pendientes", rojo: "Con rechazos" } as const;

/**
 * Where is my trámite and what do I do next: one lamp housing driven by the database semáforo, the
 * status text, progress, and the single filled action (upload the next document).
 */
export function TramiteSummary({ tramite, state }: { tramite: TramiteData; state: UploadState }) {
  const { progreso } = tramite;
  const lamp = toLampState(progreso.color_semaforo);
  const proximo = proximoDocumento(tramite.documentos);

  return (
    <section aria-labelledby="resumen-titulo" className="grid grid-cols-[44px_1fr] gap-4 rounded-lg border bg-card p-4 sm:p-5">
      <LampHousing state={lamp} />
      <div className="min-w-0">
        <p id="resumen-titulo" className="text-sm font-extrabold">
          {estatusLabel("tramite", tramite.estatus)}
          <span className="font-semibold text-muted-foreground"> · {SEMAFORO_TEXTO[lamp]}</span>
        </p>

        <p className="tnum mt-1 text-[34px] font-extrabold leading-none">
          {progreso.porcentaje}%
          <span className="ml-2 text-sm font-semibold text-muted-foreground">
            {progreso.aprobados} de {progreso.total} aprobados
          </span>
        </p>
        <Progress
          value={progreso.porcentaje}
          className="mt-3 h-2"
          aria-label="Avance de tu trámite"
          aria-valuetext={`${progreso.porcentaje}%, ${progreso.aprobados} de ${progreso.total} documentos aprobados`}
        />

        <p className="mt-3 text-sm leading-snug">{siguientePaso(tramite, proximo)}</p>

        {proximo && (
          <UploadControl
            doc={proximo}
            state={state}
            primary
            label={proximo.estatus === "rechazado" ? "Subir de nuevo" : "Subir siguiente documento"}
            className="mt-3 h-11 w-full sm:w-auto"
          />
        )}
        {proximo && state.errors[proximo.tipo_documento_id] && (
          // The live alert is in the document row; this copy keeps the message next to the action.
          <p aria-hidden="true" className="mt-2 text-sm font-semibold text-state-red">
            No se pudo subir: {state.errors[proximo.tipo_documento_id]}
          </p>
        )}
      </div>
    </section>
  );
}
