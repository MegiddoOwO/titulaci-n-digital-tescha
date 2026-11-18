import { useEffect, useState, type ReactNode } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  LayoutDashboard, Users, FolderOpen, FileText, ClipboardCheck, LogOut, Library, Shield, History, Menu,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNotificaciones } from "@/hooks/useNotificaciones";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { PageProps } from "@/types";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Resumen", url: "/admin", icon: LayoutDashboard },
  { title: "Expedientes", url: "/admin/expedientes", icon: FolderOpen },
  { title: "Documentos", url: "/admin/documentos", icon: FileText },
  { title: "Dictámenes", url: "/admin/dictamenes", icon: ClipboardCheck },
  { title: "Usuarios", url: "/admin/usuarios", icon: Users },
  { title: "Catálogos", url: "/admin/catalogos", icon: Library },
  { title: "ARCO", url: "/admin/arco", icon: Shield },
  { title: "Bitácora", url: "/admin/bitacora", icon: History },
];

/** Graphite rail content, shared by the fixed desktop rail and the phone drawer. */
function RailContent({ onNavigate, bell }: { onNavigate?: () => void; bell?: ReactNode }) {
  const { url, props } = usePage<PageProps>();
  const usuario = props.auth.user;
  const path = url.split("?")[0];

  // Exact match for "/admin"; prefix match for the rest.
  const isActive = (to: string) => (to === "/admin" ? path === to : path === to || path.startsWith(`${to}/`));

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground [&_:focus-visible]:outline-[hsl(var(--sidebar-ring))]">
      <div className="flex items-center justify-between px-6 pb-5 pt-6">
        <span className="text-[17px] font-extrabold text-sidebar-accent-foreground">SCA-TESCHA</span>
        {bell}
      </div>

      <nav aria-label="Administración" className="flex-1 overflow-y-auto px-3.5">
        <ul className="flex flex-col gap-[3px]">
          {menuItems.map((item) => {
            const active = isActive(item.url);
            return (
              <li key={item.url}>
                <Link
                  href={item.url}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    active && "bg-sidebar-accent font-semibold text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-3.5 py-3">
        <div className="flex items-center gap-2 px-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">{usuario?.nombre || "Administración"}</p>
            <p className="truncate text-xs text-sidebar-foreground/80">{usuario?.email}</p>
          </div>
          <ThemeToggle className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          <Link
            href="/logout"
            method="post"
            as="button"
            className="rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Opts the document into the dark tokens while a ported surface is mounted (see app.css). */
function useTableroDark() {
  useEffect(() => {
    document.documentElement.classList.add("tablero-dark");
    return () => document.documentElement.classList.remove("tablero-dark");
  }, []);
}

/** Persistent admin shell: pages opt in with `Page.layout = (page) => <AdminLayout>{page}</AdminLayout>`. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { notificaciones, noLeidas, marcarTodas } = useNotificaciones();
  const bell = <NotificationBell notificaciones={notificaciones} noLeidas={noLeidas} marcarTodas={marcarTodas} />;
  const { url } = usePage();
  useTableroDark();

  // Close the phone drawer after any navigation.
  useEffect(() => setOpen(false), [url]);

  return (
    <AppShell>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <div className="min-h-screen md:grid md:grid-cols-[210px_1fr]">
        <aside className="sticky top-0 hidden h-screen md:block">
          <RailContent bell={bell} />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-12 items-center gap-2 bg-sidebar px-3 text-sidebar-foreground [&_:focus-visible]:outline-[hsl(var(--sidebar-ring))] md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="rounded-md p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label="Abrir menú de administración"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] border-0 bg-sidebar p-0 [&>button]:text-sidebar-foreground">
                <SheetTitle className="sr-only">Menú de administración</SheetTitle>
                <SheetDescription className="sr-only">Secciones del panel de administración</SheetDescription>
                <RailContent onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <span className="flex-1 text-[17px] font-extrabold text-sidebar-accent-foreground">SCA-TESCHA</span>
            {bell}
          </header>

          <main id="contenido" className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </AppShell>
  );
}

export const adminLayout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
