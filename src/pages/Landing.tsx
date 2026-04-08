import { Link } from "react-router-dom";
import { Shield, FileCheck, Bell, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-campus.jpg";
import logo from "@/assets/tescha-logo.png";

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
  "Registro y autenticación en la plataforma",
  "Carga de documentación requerida",
  "Validación de requisitos académicos",
  "Revisión y dictamen por el comité",
  "Emisión de acta de titulación",
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-sm border-b border-primary">
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
      <section className="relative pt-16 min-h-[85vh] flex items-center">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Campus TESCHA" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        </div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-2xl animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-accent font-body text-sm font-medium">Plataforma Digital de Titulación</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Tu camino hacia la
              <span className="text-accent"> titulación</span>,
              simplificado
            </h1>
            <p className="text-primary-foreground/80 font-body text-lg md:text-xl leading-relaxed mb-8 max-w-xl">
              Gestiona, consulta y da seguimiento a tu proceso de titulación de Ingeniería en Sistemas Computacionales de manera digital, transparente y eficiente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base px-8 gap-2">
                  Comenzar Ahora
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/normativa">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold text-base px-8">
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
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Proceso de Titulación
            </h2>
            <p className="text-primary-foreground/70 font-body text-lg max-w-2xl mx-auto">
              Sigue estos sencillos pasos para completar tu trámite de titulación.
            </p>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-primary-foreground/5 border border-primary-foreground/10 rounded-lg p-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-accent-foreground font-body font-bold text-sm">{i + 1}</span>
                </div>
                <p className="text-primary-foreground font-body text-base">{step}</p>
                <CheckCircle2 className="w-5 h-5 text-accent/50 ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="TESCHA" className="h-8 w-8" />
              <div>
                <p className="text-background font-body text-sm font-semibold">Tecnológico de Estudios Superiores de Chalco</p>
                <p className="text-background/50 font-body text-xs">Sistema de Control y Administración de Titulación ISC</p>
              </div>
            </div>
            <p className="text-background/40 font-body text-sm">© 2026 TESCHA. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
