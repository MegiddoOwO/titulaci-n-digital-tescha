import { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsonRequest } from "@/lib/http";
import type { PageProps } from "@/types";

export function PrivacyConsentModal() {
  const { auth } = usePage<PageProps>().props;
  const [loading, setLoading] = useState(false);

  // Unknown URLs render the 404 page without the shared props, so `auth` can be absent.
  if (!auth?.user || auth.consentimiento) return null;

  const handleAceptar = async () => {
    setLoading(true);
    try {
      await jsonRequest("/privacidad/consentimiento", "POST", {});
      // Refresh only the shared auth prop; the modal disappears once consentimiento is true.
      router.reload({ only: ["auth"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg bg-card text-card-foreground rounded-[10px] shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-sidebar p-5 text-sidebar-foreground flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-sidebar-foreground" />
          <div>
            <h2 className="font-display text-lg font-bold">Aviso de Privacidad</h2>
            <p className="text-sidebar-foreground/70 text-xs">Ley General de Protección de Datos Personales</p>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-sm text-muted-foreground">
          <p>
            El Tecnológico de Estudios Superiores de Chalco (TESCHA), a través de la División de
            Ingeniería en Sistemas Computacionales, es responsable del tratamiento de sus datos personales.
          </p>

          <div className="space-y-2">
            <h3 className="font-bold text-foreground text-sm">Finalidad del tratamiento</h3>
            <p>
              Sus datos personales (nombre, número de control, correo institucional, documentos académicos)
              serán utilizados exclusivamente para la gestión y seguimiento de su proceso de titulación.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-foreground text-sm">Derechos ARCO</h3>
            <p>
              Usted tiene derecho a <strong>Acceder, Rectificar, Cancelar y Oponerse</strong> al tratamiento
              de sus datos personales. Para ejercer estos derechos, utilice la sección de Privacidad en el
              panel de control o contacte a la Jefatura de División.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-foreground text-sm">Almacenamiento y seguridad</h3>
            <p>
              Sus documentos y datos se almacenan en servidores institucionales seguros bajo protocolos
              de encriptación. No se comparten con terceros sin su consentimiento explícito.
            </p>
          </div>

          <div className="bg-muted border rounded-lg p-3 text-xs text-foreground">
            Al hacer clic en "He leído y acepto", usted consiente el tratamiento de sus datos personales
            conforme a este aviso de privacidad, en cumplimiento con la LGPDPPSO.
          </div>
        </div>

        <div className="p-4 border-t bg-muted flex justify-end gap-3">
          <Button
            onClick={handleAceptar}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm"
          >
            {loading ? "Procesando..." : "He leído y acepto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
