import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import headerBg from "@/assets/banner-tescha.jpeg";

const reglamentos = [
  {
    id: "req-generales",
    title: "Requisitos Generales de Titulación",
    content: "Para iniciar el proceso de titulación, el egresado deberá cumplir con: acreditación del 100% de créditos del plan de estudios, constancia de no adeudo, servicio social liberado, residencia profesional acreditada, y cumplimiento de requisitos de idioma según el plan vigente.",
  },
  {
    id: "modalidades",
    title: "Modalidades de Titulación",
    content: "Las modalidades de titulación disponibles son: Tesis Profesional, Proyecto de Investigación, Informe de Residencia Profesional, Examen General de Egreso (EGEL-CENEVAL), Memoria de Experiencia Profesional, y Titulación por Promedio. Cada modalidad tiene requisitos específicos que se detallan en el reglamento institucional.",
  },
  {
    id: "documentacion",
    title: "Documentación Requerida",
    content: "Los documentos necesarios incluyen: Acta de nacimiento (original y copia), CURP, Certificado de estudios, Constancia de liberación de servicio social, Carta de liberación de residencia profesional, Fotografías (tamaño título y credencial), Comprobante de pago de derechos de titulación, y Constancia de no adeudo bibliotecario y financiero.",
  },
  {
    id: "plazos",
    title: "Plazos y Calendario",
    content: "El proceso de titulación tiene un calendario semestral. La entrega de documentación se realiza en las fechas establecidas por la Subdirección Académica. Una vez completada la documentación, el dictamen se emite en un plazo máximo de 30 días hábiles. El acto protocolario de titulación se programa de acuerdo con el calendario institucional.",
  },
  {
    id: "comite",
    title: "Comité de Titulación",
    content: "El Comité de Titulación está integrado por el Jefe de División de ISC, un representante de la Subdirección Académica y docentes designados. Sus funciones incluyen la revisión de expedientes, validación de requisitos, emisión de dictámenes y programación de actos protocolarios.",
  },
];

const Normativa = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div 
        className="relative py-16 bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${headerBg})` }}
      >
        <div className="absolute inset-0 bg-primary/90 backdrop-blur-sm z-0"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <Link to="/">
            <Button variant="ghost" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-6 gap-2 font-body">
              <ArrowLeft className="w-4 h-4" /> Regresar al Inicio
            </Button>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-accent-foreground" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
              Normativa de Titulación
            </h1>
          </div>
          <p className="text-primary-foreground/70 font-body text-lg max-w-2xl">
            Consulta el reglamento, requisitos y lineamientos del proceso de titulación de Ingeniería en Sistemas Computacionales.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-xl font-semibold text-foreground">Reglamento y Lineamientos</h2>
            <Button variant="outline" className="gap-2 font-body text-sm">
              <Download className="w-4 h-4" /> Descargar PDF
            </Button>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {reglamentos.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="bg-card border border-border rounded-lg px-6 data-[state=open]:border-accent/50 transition-colors"
              >
                <AccordionTrigger className="font-display text-base font-semibold text-foreground hover:no-underline py-5">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="font-body text-muted-foreground text-sm leading-relaxed pb-5">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 bg-gold-light border border-accent/20 rounded-lg p-6">
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">¿Tienes dudas?</h3>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Acércate a la División de Ingeniería en Sistemas Computacionales o envía un correo a titulacion.isc@tescha.edu.mx
            </p>
            <Button className="bg-primary text-primary-foreground hover:bg-navy-light gap-2 font-body">
              <ExternalLink className="w-4 h-4" /> Contactar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Normativa;
