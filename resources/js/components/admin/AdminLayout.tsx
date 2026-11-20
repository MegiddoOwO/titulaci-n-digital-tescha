import type { ReactNode } from "react";
import { LayoutDashboard, Users, FolderOpen, FileText, ClipboardCheck, Library, Shield, History, MailPlus } from "lucide-react";
import AppShellRail, { type RailItem } from "@/components/layout/AppShellRail";

const menuItems: RailItem[] = [
  { title: "Resumen", url: "/admin", icon: LayoutDashboard },
  { title: "Expedientes", url: "/admin/expedientes", icon: FolderOpen },
  { title: "Documentos", url: "/admin/documentos", icon: FileText },
  { title: "Dictámenes", url: "/admin/dictamenes", icon: ClipboardCheck },
  { title: "Usuarios", url: "/admin/usuarios", icon: Users },
  { title: "Invitaciones", url: "/admin/invitaciones", icon: MailPlus },
  { title: "Catálogos", url: "/admin/catalogos", icon: Library },
  { title: "ARCO", url: "/admin/arco", icon: Shield },
  { title: "Bitácora", url: "/admin/bitacora", icon: History },
];

/** Persistent admin shell: pages opt in with `Page.layout = (page) => <AdminLayout>{page}</AdminLayout>`. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShellRail items={menuItems} rootUrl="/admin" roleLabel="administración" userFallback="Administración">
      {children}
    </AppShellRail>
  );
}

export const adminLayout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
