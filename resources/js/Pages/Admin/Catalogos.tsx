import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Loader2, Plus, Pencil, Power, PowerOff, BookOpen, Building2, FileCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { adminLayout } from "@/components/admin/AdminLayout";
import { useAdminToasts } from "@/components/admin/adminToasts";

type Item = { id: number; activo: number; [column: string]: string | number | null };

interface Field {
  key: string;
  label: string;
  type?: "text" | "date" | "textarea" | "number" | "email";
  required?: boolean;
}

interface Tab {
  key: string;
  label: string;
  icon: typeof FileCheck;
  /** Column used as the row title. */
  title: string;
  /** Extra read-only columns of the table. */
  columns: { key: string; label: string; className?: string }[];
  fields: Field[];
}

// `opciones` and `tipos-documento` match the legacy page. The Express `normativa`/`directorio`
// catalogs never worked (they wrote a non-existent `nombre`), so those tabs edit the real columns.
const TABS: Tab[] = [
  {
    key: "opciones", label: "Opciones de Titulación", icon: FileCheck, title: "nombre",
    columns: [{ key: "fecha_limite", label: "Fecha límite", className: "w-32" }],
    fields: [
      { key: "nombre", label: "Nombre *", required: true },
      { key: "fecha_limite", label: "Fecha límite (opcional)", type: "date" },
    ],
  },
  {
    key: "tipos-documento", label: "Tipos de Documento", icon: FileText, title: "nombre", columns: [],
    fields: [{ key: "nombre", label: "Nombre *", required: true }],
  },
  {
    key: "normativa", label: "Normativa", icon: BookOpen, title: "titulo",
    columns: [{ key: "categoria", label: "Categoría" }],
    fields: [
      { key: "titulo", label: "Título *", required: true },
      { key: "categoria", label: "Categoría" },
      { key: "contenido", label: "Contenido *", type: "textarea", required: true },
      { key: "orden", label: "Orden", type: "number" },
    ],
  },
  {
    key: "directorio", label: "Directorio", icon: Building2, title: "nombre",
    columns: [{ key: "cargo", label: "Cargo" }, { key: "departamento", label: "Departamento" }],
    fields: [
      { key: "nombre", label: "Nombre *", required: true },
      { key: "cargo", label: "Cargo *", required: true },
      { key: "departamento", label: "Departamento *", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "telefono", label: "Teléfono" },
      { key: "extension", label: "Extensión" },
      { key: "orden", label: "Orden", type: "number" },
    ],
  },
];

const cell = (item: Item, tab: Tab, key: string) => {
  const value = item[key];
  if (key === "fecha_limite") {
    return value ? new Date(value + "T00:00:00").toLocaleDateString("es-MX") : "Sin fecha";
  }
  return value ?? "";
};

export default function AdminCatalogos({ tab: tabKey, items }: { tab: string; items: Item[] }) {
  const { success, failure } = useAdminToasts();
  const tab = TABS.find((t) => t.key === tabKey) || TABS[0];
  const Icon = tab.icon;

  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // The active tab lives in the query string, so only that catalog is loaded per visit.
  const changeTab = (key: string) => {
    setEditing(null);
    setShowForm(false);
    router.get("/admin/catalogos", { tab: key }, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      onStart: () => setLoading(true),
      onFinish: () => setLoading(false),
    });
  };

  const openForm = (item: Item | null) => {
    setEditing(item);
    setValues(Object.fromEntries(tab.fields.map((f) => [f.key, item ? String(item[f.key] ?? "") : ""])));
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/admin/catalogos/${tab.key}/${editing.id}` : `/admin/catalogos/${tab.key}`;
    const options = {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setSaving(true),
      onFinish: () => setSaving(false),
      onSuccess: (p: Parameters<typeof success>[0]) => {
        success(p);
        setShowForm(false);
        setEditing(null);
        setValues({});
      },
      onError: failure,
    };
    if (editing) router.put(url, values, options);
    else router.post(url, values, options);
  };

  const handleToggle = (id: number) => {
    router.put(`/admin/catalogos/${tab.key}/${id}/toggle`, {}, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: (p) => success(p),
      onError: failure,
    });
  };

  const colSpan = 3 + tab.columns.length;

  return (
    <div className="p-6 space-y-6">
      <Head title="Catálogos" />
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Catálogos</h1>
        <p className="text-muted-foreground font-body text-sm">Administra los catálogos del sistema</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab.key === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => changeTab(t.key)}
            className="gap-1.5"
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-foreground" />
          <span className="font-display text-sm">
            {tab.label} ({items.length})
          </span>
        </div>
        <Button size="sm" onClick={() => openForm(null)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Nuevo
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body text-xs">{tab.title === "titulo" ? "Título" : "Nombre"}</TableHead>
              {tab.columns.map((c) => (
                <TableHead key={c.key} className={`font-body text-xs ${c.className ?? ""}`}>{c.label}</TableHead>
              ))}
              <TableHead className="font-body text-xs w-24">Estado</TableHead>
              <TableHead className="font-body text-xs w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={colSpan} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground text-sm">No hay registros.</TableCell></TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-body text-sm">{item[tab.title]}</TableCell>
                  {tab.columns.map((c) => (
                    <TableCell key={c.key} className="text-xs text-muted-foreground">{cell(item, tab, c.key)}</TableCell>
                  ))}
                  <TableCell>
                    <Badge className={`text-[10px] ${item.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openForm(item)}>
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
            <DialogDescription>{tab.label}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {tab.fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs">{f.label}</label>
                {f.type === "textarea" ? (
                  <Textarea
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    required={f.required}
                    rows={4}
                  />
                ) : (
                  <Input
                    type={f.type ?? "text"}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    required={f.required}
                    className="h-9"
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button size="sm" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

AdminCatalogos.layout = adminLayout;
