import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import AppShellRail, { type RailItem } from "@/components/layout/AppShellRail";

const menuItems: RailItem[] = [{ title: "Mis estudiantes", url: "/asesor", icon: GraduationCap }];

/** Persistent asesor shell (same rail as admin, one section for now). */
export default function AsesorLayout({ children }: { children: ReactNode }) {
  return (
    <AppShellRail items={menuItems} rootUrl="/asesor" roleLabel="asesor" userFallback="Asesor">
      {children}
    </AppShellRail>
  );
}

export const asesorLayout = (page: ReactNode) => <AsesorLayout>{page}</AsesorLayout>;
