import type { ReactNode } from "react";
import { Link } from "@inertiajs/react";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/tescha-logo.svg";
import { cn } from "@/lib/utils";

interface PublicShellProps {
  children: ReactNode;
  /** Where the top-bar link goes. Defaults to the landing (which redirects signed-in users home). */
  back?: { href: string; label: string };
  /** Tailwind max-width class for the content column. */
  widthClass?: string;
}

/**
 * Minimal frame for pages outside the role shells (sign-in, password reset, 404, normativa):
 * graphite top bar with crest and product name, a way back and the theme toggle. No rail.
 */
export default function PublicShell({ children, back = { href: "/", label: "Inicio" }, widthClass = "max-w-5xl" }: PublicShellProps) {

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <header className="bg-sidebar text-sidebar-foreground [&_:focus-visible]:outline-[hsl(var(--sidebar-ring))]">
        <div className={cn("mx-auto flex h-14 w-full items-center gap-2 px-4 md:px-6", widthClass)}>
          <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-md py-1 pr-2" aria-label="SCA-TESCHA, ir al inicio">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white p-1">
              <img src={logo} alt="" className="h-full w-full object-contain" />
            </span>
            <span className="shrink-0 whitespace-nowrap text-[17px] font-extrabold text-sidebar-accent-foreground">SCA-TESCHA</span>
          </Link>
          <span className="flex-1" />
          <Link
            href={back.href}
            aria-label={back.label}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{back.label}</span>
          </Link>
          <ThemeToggle className="p-3.5 sm:p-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 outline-none">
        {children}
      </main>

      <footer className="border-t border-border">
        <p className={cn("mx-auto w-full px-4 py-4 text-xs text-muted-foreground md:px-6", widthClass)}>
          Tecnológico de Estudios Superiores de Chalco · Ingeniería en Sistemas Computacionales
        </p>
      </footer>
    </div>
  );
}
