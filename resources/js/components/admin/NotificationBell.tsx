import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { useNotificaciones } from "@/hooks/useNotificaciones";

type BellData = ReturnType<typeof useNotificaciones>;

/** Rail/top-bar bell: unread count on the trigger, list and "Marcar todas" in a popover. */
export function NotificationBell({ notificaciones, noLeidas, marcarTodas }: Pick<BellData, "notificaciones" | "noLeidas" | "marcarTodas">) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative rounded-md p-3 text-sidebar-foreground md:p-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={noLeidas > 0 ? `Notificaciones: ${noLeidas} sin leer` : "Notificaciones: sin novedades"}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {noLeidas > 0 && (
            <span className="tnum absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sidebar-accent-foreground px-1 text-[10px] font-extrabold text-sidebar">
              {noLeidas > 9 ? "9+" : noLeidas}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-extrabold">Notificaciones</h2>
          <span className="tnum text-xs text-muted-foreground">
            {noLeidas === 1 ? "1 sin leer" : `${noLeidas} sin leer`}
          </span>
        </div>
        <ul className="max-h-72 divide-y overflow-y-auto">
          {notificaciones.length === 0 ? (
            <li className="px-4 py-6 text-center text-xs text-muted-foreground">No tienes notificaciones.</li>
          ) : (
            notificaciones.map((n) => (
              <li key={n.id} className="px-4 py-2.5">
                <p className={`text-xs leading-snug ${n.leida ? "text-muted-foreground" : "font-semibold"}`}>
                  {!n.leida && <span className="mr-1.5 rounded border px-1 text-[10px] font-extrabold uppercase">Nueva</span>}
                  {n.titulo}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{n.mensaje}</p>
                <p className="tnum mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString("es-MX")}</p>
              </li>
            ))
          )}
        </ul>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full text-xs font-semibold" disabled={noLeidas === 0} onClick={() => marcarTodas()}>
            Marcar todas como leídas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
