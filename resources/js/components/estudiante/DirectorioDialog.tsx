import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { jsonRequest } from "@/lib/http";

interface Contacto {
  id: number;
  nombre: string;
  cargo: string;
  departamento: string;
  email: string | null;
  telefono: string | null;
  extension: string | null;
}

function Contactos() {
  const [contactos, setContactos] = useState<Contacto[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let current = true;
    // Debounced so typing does not fire a request per key.
    const id = window.setTimeout(() => {
      const term = search.trim();
      jsonRequest<Contacto[]>(`/directorio${term ? `?search=${encodeURIComponent(term)}` : ""}`)
        .then((data) => current && (setContactos(data), setFailed(false)))
        .catch(() => current && (setContactos([]), setFailed(true)));
    }, search ? 250 : 0);
    return () => {
      current = false;
      window.clearTimeout(id);
    };
  }, [search]);

  return (
    <>
      <div className="grid gap-1.5">
        <Label htmlFor="directorio-buscar">Buscar por nombre, cargo o departamento</Label>
        <Input id="directorio-buscar" type="search" value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" />
      </div>

      <div className="max-h-[50vh] overflow-y-auto rounded-md border" aria-live="polite">
        {contactos === null ? (
          <div className="grid gap-3 p-4" role="status" aria-label="Cargando directorio">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : contactos.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            {failed ? "No se pudo cargar el directorio. Intenta de nuevo en un momento." : "No hay contactos que coincidan con tu búsqueda."}
          </p>
        ) : (
          <ul className="divide-y">
            {contactos.map((c) => (
              <li key={c.id} className="px-4 py-3 text-sm">
                <p className="font-semibold">{c.nombre}</p>
                <p className="text-muted-foreground">
                  {c.cargo} · {c.departamento}
                </p>
                {c.email && (
                  <a href={`mailto:${c.email}`} className="break-all underline underline-offset-2">
                    {c.email}
                  </a>
                )}
                {(c.telefono || c.extension) && (
                  <p className="tnum text-muted-foreground">
                    {c.telefono}
                    {c.telefono && c.extension ? " · " : ""}
                    {c.extension ? `Ext. ${c.extension}` : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export function DirectorioDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Directorio institucional</DialogTitle>
          <DialogDescription>Contactos de TESCHA para dudas sobre tu trámite.</DialogDescription>
        </DialogHeader>
        <Contactos />
      </DialogContent>
    </Dialog>
  );
}
