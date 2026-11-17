import type { ReactNode } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  LayoutDashboard, Users, FileText, ClipboardCheck, Settings, LogOut, GraduationCap, Library, Shield, Bell, History,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useNotificaciones } from "@/hooks/useNotificaciones";
import logo from "@/assets/tescha-logo.svg";
import type { PageProps } from "@/types";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  { title: "Panel General", url: "/admin", icon: LayoutDashboard },
  { title: "Expedientes", url: "/admin/expedientes", icon: Users },
  { title: "Documentos", url: "/admin/documentos", icon: FileText },
  { title: "Dictámenes", url: "/admin/dictamenes", icon: ClipboardCheck },
  { title: "Usuarios", url: "/admin/usuarios", icon: Settings },
  { title: "Catálogos", url: "/admin/catalogos", icon: Library },
  { title: "ARCO", url: "/admin/arco", icon: Shield },
  { title: "Bitácora", url: "/admin/bitacora", icon: History },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { url, props } = usePage<PageProps>();
  const usuario = props.auth.user;
  const { noLeidas } = useNotificaciones();
  const path = url.split("?")[0];

  // react-router `end` semantics for "/admin"; prefix match for the rest.
  const isActive = (to: string) => (to === "/admin" ? path === to : path === to || path.startsWith(`${to}/`));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-primary">
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
          <img src={logo} alt="TESCHA" className="h-8 w-8 flex-shrink-0" />
          {!collapsed && (
            <div className="flex-1">
              <p className="text-sidebar-foreground font-body text-sm font-semibold">TESCHA</p>
              <p className="text-sidebar-foreground/50 font-body text-[10px]">Administración</p>
            </div>
          )}
          <div className="relative">
            <Bell className="w-4 h-4 text-sidebar-foreground/70" />
            {noLeidas > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {noLeidas > 9 ? "9+" : noLeidas}
              </span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 font-body text-[10px] uppercase tracking-wider">
            {!collapsed && "Menú Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground transition-all duration-200",
                        isActive(item.url) && "bg-sidebar-accent text-sidebar-primary-foreground font-semibold shadow-inner",
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="font-body text-sm">{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-primary border-t border-sidebar-border">
        <div className={`flex items-center gap-3 px-3 py-3 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground font-body text-sm font-medium truncate">{usuario?.nombre || "Admin"} TESCHA</p>
              <p className="text-sidebar-foreground/50 font-body text-[10px] truncate">{usuario?.email || "admin@tescha.edu.mx"}</p>
            </div>
          )}
          {!collapsed && (
            <Link
              href="/logout"
              method="post"
              as="button"
              className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

/** Persistent admin shell: pages opt in with `Page.layout = (page) => <AdminLayout>{page}</AdminLayout>`. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center border-b border-border bg-card px-2">
              <SidebarTrigger className="ml-1" />
              <span className="ml-3 font-body text-sm text-muted-foreground flex-1">Panel de Administración</span>
              <ThemeToggle />
            </header>
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AppShell>
  );
}

export const adminLayout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
