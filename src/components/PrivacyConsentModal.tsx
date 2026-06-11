import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function PrivacyConsentModal() {
  const { isAuthenticated, consentido, darConsentimiento } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated || consentido) return null;

  const handleAceptar = async () => {
    setLoading(true);
    await darConsentimiento();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-[#56212f] p-5 text-white flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#BC955B]" />
          <div>
            <h2 className="font-display text-lg font-bold">Aviso de Privacidad</h2>
            <p className="text-white/70 text-xs">Ley General de Protección de Datos Personales</p>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-sm text-gray-600">
          <p>
            El Tecnológico de Estudios Superiores de Chalco (TESCHA), a través de la División de
            Ingeniería en Sistemas Computacionales, es responsable del tratamiento de sus datos personales.
          </p>

          <div className="space-y-2">
            <h3 className="font-bold text-[#56212f] text-sm">Finalidad del tratamiento</h3>
            <p>
              Sus datos personales (nombre, número de control, correo institucional, documentos académicos)
              serán utilizados exclusivamente para la gestión y seguimiento de su proceso de titulación.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#56212f] text-sm">Derechos ARCO</h3>
            <p>
              Usted tiene derecho a <strong>Acceder, Rectificar, Cancelar y Oponerse</strong> al tratamiento
              de sus datos personales. Para ejercer estos derechos, utilice la sección de Privacidad en el
              panel de control o contacte a la Jefatura de División.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#56212f] text-sm">Almacenamiento y seguridad</h3>
            <p>
              Sus documentos y datos se almacenan en servidores institucionales seguros bajo protocolos
              de encriptación. No se comparten con terceros sin su consentimiento explícito.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            Al hacer clic en "He leído y acepto", usted consiente el tratamiento de sus datos personales
            conforme a este aviso de privacidad, en cumplimiento con la LGPDPPSO.
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button
            onClick={handleAceptar}
            disabled={loading}
            className="bg-[#56212f] hover:bg-[#8a2036] text-white font-semibold text-sm"
          >
            {loading ? "Procesando..." : "He leído y acepto"}
          </Button>
        </div>
      </div>
    </div>
  );
}
