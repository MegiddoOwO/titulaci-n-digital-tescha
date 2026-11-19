import type { ReactNode } from "react";
import { ClipboardList, Gavel } from "lucide-react";
import AppShellRail, { type RailItem } from "@/components/layout/AppShellRail";

const menuItems: RailItem[] = [
  { title: "Mi trámite", url: "/dashboard", icon: ClipboardList },
  { title: "Normativa", url: "/normativa", icon: Gavel },
];

/** Persistent student shell: the shared Tablero rail with the student's own sections. */
export default function EstudianteLayout({ children }: { children: ReactNode }) {
  return (
    <AppShellRail items={menuItems} rootUrl="/dashboard" roleLabel="estudiante" userFallback="Estudiante">
      {children}
    </AppShellRail>
  );
}

export const estudianteLayout = (page: ReactNode) => <EstudianteLayout>{page}</EstudianteLayout>;
