import { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Power, PowerOff, BookOpen, Building2, FileCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { getToken } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Item { id: number; nombre: string; activo: number; fecha_limite?: string | null; }

const TABS = [
  { key: "opciones", label: "Opciones de Titulación", icon: FileCheck },
  { key: "tipos-documento", label: "Tipos de Documento", icon: FileText },
  { key: "normativa", label: "Normativa", icon: BookOpen },
  { key: "directorio", label: "Directorio", icon: Building2 },
];

const AdminCatalogos = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState("opciones");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [nombre, setNombre] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [saving, setSaving] = useState(false);

  const { icon: Icon } = TABS.find(t => t.key === tab) || TABS[0];

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/catalogos/${tab}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setItems(await res.json());
    } catch { setItems([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [tab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/catalogos/${tab}/${editing.id}`
        : `/api/admin/catalogos/${tab}`;
      const body: Record<string, unknown> = { nombre };
      if (tab === "opciones") body.fecha_limite = fechaLimite || null;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: data.message });
      setShowForm(false); setEditing(null); setNombre(""); setFechaLimite("");
      fetchItems();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally { setSaving(false); }
  };

  const handleToggle = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/catalogos/${tab}/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      toast({ title: data.message });
      fetchItems();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Catálogos</h1>
        <p className="text-muted-foreground font-body text-sm">Administra los catálogos del sistema</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <Button
            key={t.key}
            variant={tab === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => { setTab(t.key); setEditing(null); setShowForm(false); }}
            className="gap-1.5"
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-navy" />
          <span className="font-display text-sm">
            {TABS.find(t => t.key === tab)?.label} ({items.length})
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => { setEditing(null); setNombre(""); setFechaLimite(""); setShowForm(true); }}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo
        </Button>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body text-xs">Nombre</TableHead>
              {tab === "opciones" && <TableHead className="font-body text-xs w-32">Fecha límite</TableHead>}
              <TableHead className="font-body text-xs w-24">Estado</TableHead>
              <TableHead className="font-body text-xs w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-sm">No hay registros.</TableCell></TableRow>
            ) : (
              items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-body text-sm">{item.nombre}</TableCell>
                  {tab === "opciones" && (
                    <TableCell className="text-xs text-muted-foreground">
                      {item.fecha_limite ? new Date(item.fecha_limite + "T00:00:00").toLocaleDateString("es-MX") : "Sin fecha"}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge className={`text-[10px] ${item.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(item); setNombre(item.nombre); setFechaLimite(item.fecha_limite || ""); setShowForm(true); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(item.id)}>
                        {item.activo ? <PowerOff className="w-3 h-3 text-rose-500" /> : <Power className="w-3 h-3 text-emerald-500" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nuevo"} registro</DialogTitle>
            <DialogDescription>{TABS.find(t => t.key === tab)?.label}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs">Nombre *</label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} required className="h-9" />
            </div>
            {tab === "opciones" && (
              <div>
                <label className="text-xs">Fecha límite (opcional)</label>
                <Input type="date" value={fechaLimite} onChange={e => setFechaLimite(e.target.value)} className="h-9" />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCatalogos;
