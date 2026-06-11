import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import heroImage from "@/assets/banner-tescha.jpeg";

interface NormativaItem {
  id: number;
  titulo: string;
  contenido: string;
  categoria: string | null;
  modalidad_id: number | null;
  modalidad_nombre: string | null;
  orden: number;
}

const Normativa = () => {
  const [normativa, setNormativa] = useState<NormativaItem[]>([]);
  const [modalidadId, setModalidadId] = useState<string>("todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = modalidadId !== "todas" ? `?modalidad_id=${modalidadId}` : "";
    fetch(`/api/normativa${params}`)
      .then((r) => r.json())
      .then((data) => setNormativa(data))
      .finally(() => setLoading(false));
  }, [modalidadId]);

  return (
    <div className="min-h-screen bg-gray-50 font-body">
      <div className="relative h-48 md:h-64 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="absolute inset-0 bg-primary/85 backdrop-blur-sm" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-4">
          <h1 className="font-display text-2xl md:text-4xl font-bold">Normativa de Titulación</h1>
          <p className="mt-2 text-white/70 text-sm md:text-base">Lineamientos y reglamentos oficiales del proceso de titulación ISC</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-end">
          <Select value={modalidadId} onValueChange={setModalidadId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por modalidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las modalidades</SelectItem>
              <SelectItem value="1">Tesis</SelectItem>
              <SelectItem value="2">Residencias Profesionales</SelectItem>
              <SelectItem value="3">Excelencia Académica</SelectItem>
              <SelectItem value="4">EGEL-CENEVAL</SelectItem>
              <SelectItem value="5">Créditos de Posgrado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Cargando normativa...</div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {normativa.map((item) => (
              <AccordionItem
                key={item.id}
                value={`item-${item.id}`}
                className="bg-white rounded-lg border shadow-sm px-4 data-[state=open]:border-[#8A2036]/30"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-xs font-medium text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                      {item.categoria}
                    </span>
                    <span className="text-sm md:text-base font-semibold text-foreground">
                      {item.titulo}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: item.contenido.replace(/\n/g, "<br>") }}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default Normativa;
