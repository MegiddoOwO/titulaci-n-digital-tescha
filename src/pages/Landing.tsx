import { Link } from "react-router-dom";
import { Shield, FileCheck, Bell, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/banner-tescha.jpeg";
import logo from "@/assets/tescha-logo.svg";
import sgclogo1 from "@/assets/logo.svg";

const features = [
  {
    icon: Shield,
    title: "Autenticación Segura",
    description: "Acceso protegido con credenciales institucionales para garantizar la seguridad de tu expediente.",
  },
  {
    icon: FileCheck,
    title: "Seguimiento en Tiempo Real",
    description: "Consulta el estatus de tu trámite de titulación en cualquier momento desde cualquier dispositivo.",
  },
  {
    icon: Bell,
    title: "Notificaciones Automáticas",
    description: "Recibe alertas instantáneas sobre cambios en el estatus de tu proceso de titulación.",
  },
  {
    icon: BookOpen,
    title: "Normativa Centralizada",
    description: "Accede a toda la reglamentación y requisitos de titulación en un solo lugar.",
  },
];

const steps = [
  {
    title: "Registro y Validación",
    description: "Inicia tu proceso registrándote en la plataforma y validando tu estatus como egresado con el departamento de control escolar.",
  },
  {
    title: "Integración de Expediente",
    description: "Sube todos los documentos requeridos de forma digital. Nuestro sistema te indicará qué falta y qué ha sido aprobado.",
  },
  {
    title: "Selección de Opción",
    description: "Elige la modalidad de titulación que mejor se adapte a tu perfil (Tesis, CENEVAL, Promedio, etc.) y cumple con los requisitos específicos.",
  },
  {
    title: "Revisión y Aprobación",
    description: "Tu expediente y trabajo final serán revisados por el comité académico correspondiente para su aprobación formal.",
  },
  {
    title: "Ceremonia y Título",
    description: "Una vez aprobado todo, se programará tu toma de protesta y se iniciará el trámite para la emisión de tu título profesional.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-foreground/95 backdrop-blur-sm border-b border-foreground/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="TESCHA" className="h-10 w-10" />
            <div>
              <p className="text-primary-foreground font-body text-sm font-semibold tracking-wide">TESCHA</p>
              <p className="text-primary-foreground/70 font-body text-xs">Sistema de Titulación ISC</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/login">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 min-h-[85vh] flex items-center justify-center">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Campus TESCHA" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="relative container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="max-w-3xl animate-fade-in flex flex-col items-center">
            <div className="bg-white px-5 py-1.5 rounded-full mb-8 shadow-md">
              <span className="text-[#8a2036] font-body text-xs font-semibold tracking-wider uppercase">Plataforma Digital de Titulación</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal text-white leading-tight mb-6">
              Tu camino hacia la
              <span className="text-accent"> titulación</span>,
              simplificado
            </h1>
            <p className="text-white/80 font-body text-lg md:text-xl leading-relaxed mb-8 max-w-2xl">
              El Sistema de Control Académico para la Ingeniería en Sistemas Computacionales te guía paso a paso en tu proceso final.
            </p>
            <div className="flex flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-accent text-white hover:bg-accent/90 font-medium text-base px-8 border-none">
                  Comenzar Ahora
                </Button>
              </Link>
              <Link to="/normativa">
                <Button size="lg" variant="outline" className="bg-transparent border border-accent text-accent hover:bg-accent hover:text-white font-medium text-base px-8">
                  Ver Normativa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Funcionalidades del Sistema
            </h2>
            <p className="text-muted-foreground font-body text-lg max-w-2xl mx-auto">
              Herramientas diseñadas para agilizar y transparentar cada etapa del proceso de titulación.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="group bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-accent/50 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 bg-gold-light rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent transition-colors">
                  <feature.icon className="w-6 h-6 text-navy group-hover:text-accent-foreground transition-colors" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 bg-[#56212f]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Proceso de Titulación
            </h2>
            <p className="text-white/70 font-body text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Una guía estructurada para llevarte desde la culminación de tus estudios hasta la obtención de tu título.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="relative flex items-center gap-6 sm:gap-10 py-4">
                {/* Connector Line Segment */}
                <div 
                  className={`absolute left-5 w-[2px] bg-[#9A803B]/40 ${
                    i === 0 
                      ? "top-1/2 bottom-0" 
                      : i === steps.length - 1 
                      ? "top-0 bottom-1/2" 
                      : "top-0 bottom-0"
                  }`} 
                />

                {/* Step Number Circle */}
                <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-[#9A803B] flex items-center justify-center text-white font-body font-bold text-base shadow-md">
                  {i + 1}
                </div>
                
                {/* Step Card Content */}
                <div className="flex-grow bg-[#8a2036]/20 border border-white/10 rounded-lg p-6 hover:bg-[#8a2036]/30 transition-all duration-300">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#efe1ca] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-white/85 font-body text-sm sm:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 md:w-1/3">
              <img src={logo} alt="TESCHA" className="h-14 w-14" />
              <div>
                <p className="text-background font-body text-sm font-semibold">Tecnológico de Estudios Superiores de Chalco</p>
                <p className="text-background/50 font-body text-xs">Sistema de Control y Administración de Titulación ISC</p>
              </div>
            </div>
            
            {/* Logos Certificadores en medio */}
            <div className="flex items-center justify-center md:w-1/3 bg-white/5 px-6 py-4 rounded-xl">
              <img src={sgclogo1} alt="SGC Acreditación" className="h-20 w-auto opacity-80 hover:opacity-100 transition-opacity" />
            </div>

            <div className="md:w-1/3 md:text-right">
              <p className="text-background/40 font-body text-sm">© 2026 TESCHA. Todos los derechos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
