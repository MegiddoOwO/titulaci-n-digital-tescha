import { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LAMP_LABEL, LAMP_STATES, type LampState } from "@/components/ui/lamp";
import { cn } from "@/lib/utils";
import campus from "@/assets/banner-tescha.jpeg";
import logo from "@/assets/tescha-logo.svg";
import sgcLogo from "@/assets/logo.svg";

type DocEstatus = "pendiente" | "cargado" | "en revisión" | "aprobado" | "rechazado";

interface Escenario {
  id: LampState;
  boton: string;
  docs: { nombre: string; estatus: DocEstatus }[];
  /** The rule line that explains why this lamp is the lit one. */
  regla: string;
}

/* Example documents are real document types of the system; the three scenarios are illustrative, not data. */
const escenarios: Escenario[] = [
  {
    id: "ambar",
    boton: "Con pendientes",
    docs: [
      { nombre: "Certificado de estudios", estatus: "aprobado" },
      { nombre: "Constancia de inglés", estatus: "en revisión" },
      { nombre: "Fotografía", estatus: "pendiente" },
    ],
    regla: "Hay documentos pendientes, cargados o en revisión, y ninguno rechazado.",
  },
  {
    id: "rojo",
    boton: "Con rechazos",
    docs: [
      { nombre: "Certificado de estudios", estatus: "aprobado" },
      { nombre: "Constancia de inglés", estatus: "rechazado" },
      { nombre: "Fotografía", estatus: "cargado" },
    ],
    regla: "Basta un documento rechazado para que el semáforo se ponga en rojo.",
  },
  {
    id: "verde",
    boton: "Sin pendientes",
    docs: [
      { nombre: "Certificado de estudios", estatus: "aprobado" },
      { nombre: "Constancia de inglés", estatus: "aprobado" },
      { nombre: "Fotografía", estatus: "aprobado" },
    ],
    regla: "Todos los documentos están aprobados.",
  },
];

const LAMP_NAME: Record<LampState, string> = { verde: "verde", ambar: "ámbar", rojo: "rojo" };
const lampLit: Record<LampState, string> = { verde: "bg-lamp-green", ambar: "bg-lamp-amber", rojo: "bg-lamp-red" };
const lampText: Record<LampState, string> = { verde: "text-state-green", ambar: "text-state-amber", rojo: "text-state-red" };

/** The authored moment: one trámite's documents and the lamp they light, with the real rule. */
function SemaforoDemo() {
  const [activo, setActivo] = useState<LampState>("ambar");
  const escenario = escenarios.find((e) => e.id === activo)!;

  return (
    <section aria-labelledby="demo-titulo" className="rounded-[10px] border border-border bg-card p-4 text-card-foreground sm:p-6">
      <h2 id="demo-titulo" className="text-base font-extrabold">
        Así lee el sistema un trámite
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Ejemplo ilustrativo. Elige un caso y mira qué lámpara se enciende.</p>

      <div role="group" aria-label="Caso del ejemplo" className="mt-4 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
        {escenarios.map((e) => (
          <button
            key={e.id}
            type="button"
            aria-pressed={e.id === activo}
            onClick={() => setActivo(e.id)}
            className={cn(
              "min-h-11 rounded-md px-1 text-xs font-semibold leading-tight transition-colors sm:px-3 sm:text-sm",
              e.id === activo ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {e.boton}
          </button>
        ))}
      </div>

      <div className="mt-5 flex gap-4 sm:gap-6">
        <div
          role="img"
          aria-label={`Semáforo ${LAMP_NAME[activo]}: ${LAMP_LABEL[activo]}`}
          className="flex w-[72px] shrink-0 flex-col items-center gap-2.5 self-start rounded-[36px] border bg-lamp-housing p-2.5 sm:w-24 sm:gap-3 sm:rounded-[48px] sm:p-3"
          style={{ borderColor: "hsl(var(--lamp-housing-edge))" }}
        >
          {LAMP_STATES.map((s) => (
            <i
              key={s}
              aria-hidden="true"
              className={cn("block h-[52px] w-[52px] rounded-full transition-colors duration-300 motion-reduce:transition-none sm:h-[72px] sm:w-[72px]", s === activo ? lampLit[s] : "bg-lamp-off")}
            />
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <p aria-live="polite" className={cn("text-lg font-extrabold leading-tight", lampText[activo])}>
            Semáforo {LAMP_NAME[activo]}
            <span className="block text-sm font-semibold">{LAMP_LABEL[activo]}</span>
          </p>
          <ul className="mt-3 divide-y divide-border border-y border-border text-sm">
            {escenario.docs.map((d) => (
              <li key={d.nombre} className="flex flex-wrap items-baseline justify-between gap-x-3 py-2">
                <span className="font-medium">{d.nombre}</span>
                <span className={cn("font-semibold", d.estatus === "rechazado" ? "text-state-red" : d.estatus === "aprobado" ? "text-state-green" : "text-muted-foreground")}>
                  {d.estatus}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{escenario.regla}</p>
        </div>
      </div>
    </section>
  );
}

const capacidades = [
  {
    titulo: "Sube tus documentos",
    texto: "Desde el celular o la computadora. El sistema te indica cuáles faltan, cuáles están en revisión y cuáles ya fueron aprobados.",
  },
  {
    titulo: "Sigue tu avance en un semáforo",
    texto: "Rojo, ámbar o verde, siempre con su texto: sabes en qué punto estás y qué te toca hacer.",
  },
  {
    titulo: "Revisión con responsables",
    texto: "Control Escolar revisa y aprueba o rechaza cada documento. Tu asesor asignado consulta el avance de tu expediente.",
  },
  {
    titulo: "Dictamen en PDF",
    texto: "Al concluir la revisión, el dictamen de tu trámite se emite y se puede consultar en el sistema.",
  },
  {
    titulo: "Avisos cuando algo cambia",
    texto: "Recibes una notificación cuando cambia el estatus de un documento o de tu trámite.",
  },
  {
    titulo: "Privacidad a la vista",
    texto: "Aceptas el aviso de privacidad al entrar y puedes ejercer tus derechos ARCO desde tu panel.",
  },
];

const pasos = [
  {
    titulo: "Acceso y validación",
    texto: "Control Escolar da de alta tu cuenta institucional y valida tu estatus como egresado. Entras con tu número de control.",
  },
  {
    titulo: "Integración de expediente",
    texto: "Subes en digital los documentos requeridos. El sistema marca lo que falta y lo que ya fue aprobado.",
  },
  {
    titulo: "Opción de titulación",
    texto: "Tu trámite sigue la opción de titulación asignada (por ejemplo, Tesis) y cumple sus requisitos específicos.",
  },
  {
    titulo: "Revisión y aprobación",
    texto: "Tu expediente y trabajo final son revisados para su aprobación formal.",
  },
  {
    titulo: "Ceremonia y título",
    texto: "Con todo aprobado, se programa tu toma de protesta y se inicia el trámite de tu título profesional.",
  },
];

const primaryLink =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90";
const secondaryLink =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-input px-5 text-base font-semibold text-foreground transition-colors hover:bg-secondary";

const Landing = () => {

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Head title="Inicio" />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <header className="bg-sidebar text-sidebar-foreground [&_:focus-visible]:outline-[hsl(var(--sidebar-ring))]">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-1 px-4 md:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-md py-1 pr-2" aria-label="SCA-TESCHA, inicio">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white p-1">
              <img src={logo} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="truncate text-[17px] font-extrabold text-sidebar-accent-foreground">SCA-TESCHA</span>
          </Link>
          <span className="flex-1" />
          <Link
            href="/normativa"
            className="hidden min-h-11 items-center rounded-md px-3 text-sm sm:inline-flex transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            Normativa
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center whitespace-nowrap rounded-md bg-sidebar-accent px-3.5 text-sm font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-primary sm:px-4"
          >
            Iniciar sesión
          </Link>
          <ThemeToggle className="p-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
        </div>
      </header>

      <main id="contenido" className="min-w-0 flex-1">
        {/* Portada */}
        <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:py-20">
          <div>
            <h1 className="max-w-[15ch] text-[2.5rem] font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Tu titulación, siempre a la vista
            </h1>
            <p className="mt-4 max-w-[52ch] text-base leading-7 text-muted-foreground md:mt-5 md:text-lg md:leading-8">
              El Sistema de Control y Administración de Titulación de Ingeniería en Sistemas Computacionales del TESCHA te muestra, en cada momento, qué documentos faltan, cuáles se revisan y cuáles ya
              están aprobados.
            </p>
            <div className="mt-5 flex flex-row flex-wrap gap-3 md:mt-8">
              <Link href="/login" className={primaryLink}>
                Iniciar sesión
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/normativa" className={secondaryLink}>
                Ver normativa
              </Link>
            </div>
            <p className="mt-4 md:mt-5 max-w-[52ch] text-sm text-muted-foreground">
              El acceso es institucional: tu alta la gestiona Control Escolar y entras con tu número de control.
            </p>
          </div>

          <SemaforoDemo />
        </section>

        {/* Qué hace */}
        <section aria-labelledby="que-hace" className="border-t border-border">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <h2 id="que-hace" className="max-w-[14ch] text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                Qué hace el sistema por ti
              </h2>
              <p className="mt-4 max-w-[40ch] text-base leading-7 text-muted-foreground">
                Un solo lugar para el expediente de tu trámite, con las mismas reglas para estudiantes, asesores y Control Escolar.
              </p>
            </div>
            <dl className="divide-y divide-border border-y border-border">
              {capacidades.map((c) => (
                <div key={c.titulo} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-6">
                  <dt className="text-base font-bold">{c.titulo}</dt>
                  <dd className="text-[15px] leading-6 text-muted-foreground">{c.texto}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Proceso */}
        <section aria-labelledby="proceso" className="bg-sidebar text-sidebar-foreground dark:bg-sidebar-accent [&_:focus-visible]:outline-[hsl(var(--sidebar-ring))]">
          <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-20">
            <h2 id="proceso" className="text-3xl font-extrabold leading-tight tracking-tight text-sidebar-accent-foreground md:text-4xl">
              Proceso de titulación
            </h2>
            <p className="mt-4 max-w-[56ch] text-base leading-7">De la validación de tu estatus como egresado a la emisión de tu título, en cinco etapas.</p>
            <ol className="mt-10 grid gap-0 border-t border-sidebar-border dark:border-sidebar-foreground/25 lg:grid-cols-5 lg:gap-6 lg:border-t-0">
              {pasos.map((p, i) => (
                <li key={p.titulo} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-sidebar-border dark:border-sidebar-foreground/25 py-5 lg:block lg:border-b-0 lg:border-t lg:pt-5">
                  <span className="tnum text-2xl font-extrabold leading-none text-sidebar-accent-foreground lg:block">{i + 1}</span>
                  <div className="lg:mt-4">
                    <h3 className="text-lg font-bold leading-snug text-sidebar-accent-foreground">{p.titulo}</h3>
                    <p className="mt-2 text-[15px] leading-6">{p.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Cierre */}
        <section aria-labelledby="cierre" className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-14 md:px-6 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <figure className="relative aspect-square w-full max-w-sm overflow-hidden rounded-[10px] border border-border bg-card lg:order-2 lg:max-w-none">
            <img
              src={campus}
              alt="Edificio José Ma. Morelos y Pavón del Tecnológico de Estudios Superiores de Chalco"
              className="absolute left-[-114%] top-[-21%] h-auto w-[263%] max-w-none"
              loading="lazy"
            />
          </figure>
          <div className="lg:order-1">
            <h2 id="cierre" className="max-w-[18ch] text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Entra y revisa el estado de tu trámite
            </h2>
            <p className="mt-4 max-w-[48ch] text-base leading-7 text-muted-foreground">
              Si aún tienes dudas sobre requisitos u opciones de titulación, consulta primero la normativa vigente.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={primaryLink}>
                Iniciar sesión
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/normativa" className={secondaryLink}>
                Ver normativa
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar text-sidebar-foreground dark:bg-sidebar-accent">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white p-1.5">
              <img src={logo} alt="" className="h-full w-full object-contain" />
            </span>
            <div>
              <p className="text-sm font-semibold text-sidebar-accent-foreground">Tecnológico de Estudios Superiores de Chalco</p>
              <p className="text-xs">Sistema de Control y Administración de Titulación ISC</p>
            </div>
          </div>
          <span className="flex h-12 w-fit items-center rounded-md bg-white px-3">
            <img src={sgcLogo} alt="Sistema de Gestión de la Calidad" className="h-8 w-auto" />
          </span>
          <p className="text-sm">© 2026 TESCHA</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
