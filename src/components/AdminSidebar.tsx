import {
  LayoutDashboard, Users, FileText, ClipboardCheck, Settings, LogOut, GraduationCap, Library, Shield
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/tescha-logo.svg";

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
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Panel General", url: "/admin", icon: LayoutDashboard },
  { title: "Expedientes", url: "/admin/expedientes", icon: Users },
  { title: "Documentos", url: "/admin/documentos", icon: FileText },
  { title: "Dictámenes", url: "/admin/dictamenes", icon: ClipboardCheck },
  { title: "Usuarios", url: "/admin/usuarios", icon: Settings },
  { title: "Catálogos", url: "/admin/catalogos", icon: Library },
  { title: "ARCO", url: "/admin/arco", icon: Shield },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { usuario, logout } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-primary">
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
          <img src={logo} alt="TESCHA" className="h-8 w-8 flex-shrink-0" />
          {!collapsed && (
            <div>
              <p className="text-sidebar-foreground font-body text-sm font-semibold">TESCHA</p>
              <p className="text-sidebar-foreground/50 font-body text-[10px]">Administración</p>
            </div>
          )}
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
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground transition-all duration-200"
                      activeClassName="bg-sidebar-accent text-sidebar-primary-foreground font-semibold shadow-inner"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="font-body text-sm">{item.title}</span>}
                    </NavLink>
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
            <NavLink to="/" onClick={logout} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors">
              <LogOut className="w-4 h-4" />
            </NavLink>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
