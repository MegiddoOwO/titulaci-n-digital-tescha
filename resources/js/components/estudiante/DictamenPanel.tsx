import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { DictamenInfo } from "@/types/tramite";

/** Dictamen available (result, issuer, PDF) or not issued yet. */
export function DictamenPanel({ dictamen }: { dictamen: DictamenInfo | null }) {
  if (!dictamen) {
    return (
      <section aria-labelledby="dictamen-titulo" className="rounded-lg border bg-card px-4 py-3.5">
        <h2 id="dictamen-titulo" className="text-sm font-extrabold">
          Dictamen
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aún no se emite. Estará disponible cuando el comité termine la revisión de tu expediente.
        </p>
      </section>
    );
  }

  const aprobado = dictamen.resultado === "aprobado";
  return (
    <section aria-labelledby="dictamen-titulo" className="grid gap-2 rounded-lg border bg-card px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="dictamen-titulo" className="text-sm font-extrabold">
          Dictamen
        </h2>
        <StatusBadge kind="tramite" status={dictamen.resultado} />
      </div>
      <p className="text-xs text-muted-foreground">
        Emitido por {dictamen.emitido_por} el{" "}
        {new Date(dictamen.fecha_emision).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
      </p>
      {dictamen.observaciones && (
        <p className="text-sm">
          <span className="font-extrabold">Observaciones:</span> {dictamen.observaciones}
        </p>
      )}
      <p className="text-sm">
        {aprobado
          ? "Próximo paso: acude a ventanilla de Control Escolar en horario de 08:00 a 14:00 h para continuar con el trámite presencial de titulación."
          : "Revisa las observaciones, corrige los documentos señalados y contacta a tu asesor o a Control Escolar para continuar."}
      </p>
      <div>
        <Button asChild variant="outline">
          <a href="/tramites/mi-dictamen/pdf" target="_blank" rel="noopener noreferrer">
            <FileText aria-hidden="true" />
            Ver dictamen en PDF
            <span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
        </Button>
      </div>
    </section>
  );
}
