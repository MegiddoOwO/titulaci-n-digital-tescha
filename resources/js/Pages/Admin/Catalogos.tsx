import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Loader2, Plus, Pencil, Power, PowerOff, BookOpen, Building2, FileCheck, FileText, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
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

  const titleHead = tab.title === "titulo" ? "Título" : "Nombre";
  const rowName = (item: Item) => String(item[tab.title] ?? "");

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-4 px-4 py-6 sm:px-8">
      <Head title="Catálogos" />
      <div>
        <h1 className="text-2xl font-extrabold">Catálogos</h1>
        <p className="text-sm text-muted-foreground">Administra los catálogos del sistema</p>
      </div>

      <nav className="grid grid-cols-2 gap-1 rounded-md border bg-card p-0.5 sm:flex sm:w-fit sm:flex-wrap" aria-label="Catálogo">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-current={tab.key === t.key ? "page" : undefined}
            onClick={() => changeTab(t.key)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              tab.key === t.key
                ? "bg-secondary font-semibold text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-extrabold">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          {tab.label} <span className="tnum text-sm font-normal text-muted-foreground">({items.length})</span>
        </h2>
        <Button onClick={() => openForm(null)} className="gap-1.5">
          <Plus aria-hidden="true" /> Nuevo
        </Button>
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground" aria-label={tab.label}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">No hay registros.</p>
            <p className="max-w-md text-sm text-muted-foreground">Este catálogo está vacío. Usa "Nuevo" para agregar el primer registro.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{titleHead}</TableHead>
                {tab.columns.map((c) => (
                  <TableHead key={c.key} className={`hidden md:table-cell ${c.className ?? ""}`}>{c.label}</TableHead>
                ))}
                <TableHead>Estado</TableHead>
                <TableHead className="w-px"><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="py-2.5">
                    <p className="text-sm font-semibold leading-snug">{rowName(item)}</p>
                    {tab.columns.length > 0 && (
                      <p className="tnum text-xs text-muted-foreground md:hidden">
                        {tab.columns.map((c) => String(cell(item, tab, c.key))).filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </TableCell>
                  {tab.columns.map((c) => (
                    <TableCell key={c.key} className="tnum hidden py-2.5 text-sm text-muted-foreground md:table-cell">
                      {cell(item, tab, c.key)}
                    </TableCell>
                  ))}
                  <TableCell className="py-2.5">
                    <StatusBadge kind="cuenta" status={item.activo ? "activo" : "inactivo"} />
                  </TableCell>
                  <TableCell className="py-2.5 pr-3">
                    <div className="flex flex-nowrap items-center justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openForm(item)} aria-label={`Editar ${rowName(item)}`} title="Editar">
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handleToggle(item.id)}
                        aria-label={`${item.activo ? "Desactivar" : "Activar"} ${rowName(item)}`}
                        title={item.activo ? "Desactivar" : "Activar"}
                      >
                        {item.activo ? <PowerOff aria-hidden="true" /> : <Power aria-hidden="true" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar" : "Nuevo"} registro</DialogTitle>
            <DialogDescription>{tab.label}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {tab.fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <label htmlFor={`catalogo-${f.key}`} className="text-xs font-semibold">{f.label}</label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={`catalogo-${f.key}`}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    required={f.required}
                    rows={4}
                  />
                ) : (
                  <Input
                    id={`catalogo-${f.key}`}
                    type={f.type ?? "text"}
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                    required={f.required}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

AdminCatalogos.layout = adminLayout;
