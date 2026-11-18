import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Search, UserPlus, Loader2, ShieldCheck, ShieldX, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { adminLayout } from "@/components/admin/AdminLayout";
import { useAdminToasts } from "@/components/admin/adminToasts";
import { jsonRequest } from "@/lib/http";

interface UsuarioRow {
  id: number;
  numero_control: string;
  email: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  rol: string;
  activo: number;
  grado_academico: string | null;
  carga_maxima: number | null;
}

interface Docente {
  id: number;
  nombre_completo: string;
  carga_actual: number;
  carga_maxima: number | null;
}

interface Props {
  usuarios: UsuarioRow[];
  total: number;
  page: number;
  totalPages: number;
  filters: { search: string; rol: string };
  docentes: Docente[];
  opciones: { id: number; nombre: string }[];
}

type Rol = "estudiante" | "asesor" | "administrativo";

interface FormData {
  numero_control: string;
  email: string;
  password: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  rol: Rol;
  grado_academico: string;
  carga_maxima: number;
}

const emptyForm: FormData = {
  numero_control: "", email: "", password: "", nombre: "", apellido_paterno: "",
  apellido_materno: "", rol: "estudiante", grado_academico: "", carga_maxima: 5,
};

interface FieldsProps {
  data: FormData;
  onChange: (next: FormData) => void;
  passwordLabel: string;
  passwordPlaceholder?: string;
  opciones: Props["opciones"];
  docentes: Docente[];
  opcion: string;
  onOpcion: (v: string) => void;
  asesor: string;
  onAsesor: (v: string) => void;
  asesorLabel: string;
}

/** Fields shared by the create and edit dialogs (identical layout in the legacy page). */
function UsuarioFields({
  data, onChange, passwordLabel, passwordPlaceholder, opciones, docentes, opcion, onOpcion, asesor, onAsesor, asesorLabel,
}: FieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs">Matrícula *</label>
          <Input value={data.numero_control} onChange={(e) => onChange({ ...data, numero_control: e.target.value })} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-xs">Rol *</label>
          <Select value={data.rol} onValueChange={(v) => onChange({ ...data, rol: v as Rol })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="estudiante">Estudiante</SelectItem>
              <SelectItem value="asesor">Asesor</SelectItem>
              <SelectItem value="administrativo">Administrativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-xs">Email *</label>
        <Input type="email" value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} className="h-8 text-xs" />
      </div>
      <div>
        <label className="text-xs">{passwordLabel}</label>
        <Input
          type="password"
          value={data.password}
          onChange={(e) => onChange({ ...data, password: e.target.value })}
          className="h-8 text-xs"
          placeholder={passwordPlaceholder}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs">Nombre *</label>
          <Input value={data.nombre} onChange={(e) => onChange({ ...data, nombre: e.target.value })} className="h-8 text-xs" />
        </div>
        <div>
          <label className="text-xs">Apellido Paterno *</label>
          <Input value={data.apellido_paterno} onChange={(e) => onChange({ ...data, apellido_paterno: e.target.value })} className="h-8 text-xs" />
        </div>
      </div>
      <div>
        <label className="text-xs">Apellido Materno</label>
        <Input value={data.apellido_materno} onChange={(e) => onChange({ ...data, apellido_materno: e.target.value })} className="h-8 text-xs" />
      </div>
      {data.rol === "estudiante" && (
        <>
          <div>
            <label className="text-xs">Opción de Titulación</label>
            <Select value={opcion} onValueChange={onOpcion}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {opciones.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs">{asesorLabel}</label>
            <Select value={asesor} onValueChange={onAsesor}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sin asesor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asesor</SelectItem>
                {docentes.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)} disabled={d.carga_actual >= (d.carga_maxima || 5)}>
                    {d.nombre_completo} ({d.carga_actual}/{d.carga_maxima || 5})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      {data.rol === "asesor" && (
        <div>
          <label className="text-xs">Grado Académico</label>
          <Input
            value={data.grado_academico}
            onChange={(e) => onChange({ ...data, grado_academico: e.target.value })}
            className="h-8 text-xs"
            placeholder="Mtra., Dr., etc."
          />
        </div>
      )}
    </>
  );
}

export default function AdminUsuarios({ usuarios, page, totalPages, filters, docentes, opciones }: Props) {
  const { success, failure } = useAdminToasts();
  const [search, setSearch] = useState(filters.search);
  const [rolFilter, setRolFilter] = useState(filters.rol || "todos");
  const [loading, setLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState("none");
  const [opcionTitulacionSeleccionada, setOpcionTitulacionSeleccionada] = useState("1");
  const [creating, setCreating] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState<FormData>(emptyForm);
  const [editAsesorSeleccionado, setEditAsesorSeleccionado] = useState("none");
  const [editOpcionSeleccionada, setEditOpcionSeleccionada] = useState("1");
  const [editTramiteId, setEditTramiteId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

  // Server-side search/filter/pagination: the query string drives the Inertia props.
  const visit = (next: { search: string; rol: string; page: number }) => {
    router.get(
      "/admin/usuarios",
      {
        ...(next.search ? { search: next.search } : {}),
        ...(next.rol !== "todos" ? { rol: next.rol } : {}),
        ...(next.page > 1 ? { page: next.page } : {}),
      },
      {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        onStart: () => setLoading(true),
        onFinish: () => setLoading(false),
      },
    );
  };

  const handleCreate = () => {
    if (
      formData.rol === "estudiante" &&
      asesorSeleccionado === "none" &&
      !window.confirm("¿Crear estudiante sin asesor asignado? El asesor podrá asignarse después.")
    ) {
      return;
    }
    router.post(
      "/admin/usuarios",
      {
        ...formData,
        ...(asesorSeleccionado !== "none" ? { asesor_id: asesorSeleccionado } : {}),
        opcion_titulacion_id: opcionTitulacionSeleccionada,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onStart: () => setCreating(true),
        onFinish: () => setCreating(false),
        onSuccess: (p) => {
          success(p, "Usuario creado", true);
          setShowCreate(false);
          setFormData(emptyForm);
          setAsesorSeleccionado("none");
          setOpcionTitulacionSeleccionada("1");
        },
        onError: failure,
      },
    );
  };

  const handleToggle = (id: number) => {
    router.put(`/admin/usuarios/${id}/toggle`, {}, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: (p) => success(p),
      onError: failure,
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    router.delete(`/admin/usuarios/${deleteId}`, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setDeleting(true),
      onFinish: () => setDeleting(false),
      onSuccess: (p) => {
        success(p);
        setDeleteId(null);
      },
      onError: (errors) => {
        // Guards (self-delete, last administrator, linked rows) answer with their Spanish message.
        failure(errors);
      },
    });
  };

  const handleEdit = async (user: UsuarioRow) => {
    setEditId(user.id);
    setEditData({
      numero_control: user.numero_control || "",
      email: user.email || "",
      nombre: user.nombre || "",
      apellido_paterno: user.apellido_paterno || "",
      apellido_materno: user.apellido_materno || "",
      rol: (user.rol as Rol) || "estudiante",
      grado_academico: user.grado_academico || "",
      carga_maxima: user.carga_maxima || 5,
      password: "",
    });
    setEditAsesorSeleccionado("none");
    setEditOpcionSeleccionada("1");
    setEditTramiteId(null);

    if (user.rol === "estudiante") {
      // Best effort, like the legacy page: find the student's tramite to preselect advisor and option.
      try {
        const list = await jsonRequest<{ expedientes?: { id: number }[] }>(
          `/admin/expedientes?search=${encodeURIComponent(user.numero_control)}&limit=1`,
        );
        const tramiteId = list.expedientes?.[0]?.id;
        if (tramiteId) {
          setEditTramiteId(tramiteId);
          const tramite = await jsonRequest<{
            asignaciones?: { usuario_id?: number; rol_asignacion?: string }[];
            opcion_titulacion_id?: number;
          }>(`/admin/expedientes/${tramiteId}`);
          const asesor = tramite.asignaciones?.find((a) => a.rol_asignacion === "asesor");
          if (asesor?.usuario_id) setEditAsesorSeleccionado(String(asesor.usuario_id));
          if (tramite.opcion_titulacion_id) setEditOpcionSeleccionada(String(tramite.opcion_titulacion_id));
        }
      } catch {
        /* best effort */
      }
    }

    setShowEdit(true);
  };

  const handleUpdate = () => {
    const body: Record<string, string | number> = {
      numero_control: editData.numero_control,
      email: editData.email,
      nombre: editData.nombre,
      apellido_paterno: editData.apellido_paterno,
      apellido_materno: editData.apellido_materno,
      rol: editData.rol,
      grado_academico: editData.grado_academico,
      carga_maxima: editData.carga_maxima,
    };
    if (editData.password) body.password = editData.password;

    router.put(`/admin/usuarios/${editId}`, body, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setUpdating(true),
      onFinish: () => setUpdating(false),
      onSuccess: async (p) => {
        // Advisor and option live on the tramite. The advisor is replaced (or removed) server-side in
        // one transaction; its Spanish error, if any, is shown and the option is not saved.
        if (editData.rol === "estudiante" && editTramiteId) {
          try {
            await jsonRequest(`/admin/tramites/${editTramiteId}/asesor`, "PUT", {
              usuario_id: editAsesorSeleccionado === "none" ? null : parseInt(editAsesorSeleccionado),
            });
            if (editOpcionSeleccionada) {
              await jsonRequest(`/admin/expedientes/${editTramiteId}`, "PUT", {
                opcion_titulacion_id: parseInt(editOpcionSeleccionada),
              });
            }
          } catch (e) {
            failure(e instanceof Error ? e.message : "Error desconocido");
          }
          router.reload({ only: ["docentes", "usuarios"] });
        }
        success(p, "Usuario actualizado", true);
        setShowEdit(false);
      },
      onError: failure,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Head title="Usuarios" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground font-body text-sm">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <UserPlus className="w-4 h-4" /> Nuevo Usuario
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de control, nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && visit({ search, rol: rolFilter, page: 1 })}
          />
        </div>
        <Select
          value={rolFilter}
          onValueChange={(v) => {
            setRolFilter(v);
            visit({ search, rol: v, page: 1 });
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="estudiante">Estudiantes</SelectItem>
            <SelectItem value="asesor">Asesores</SelectItem>
            <SelectItem value="administrativo">Administrativos</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => visit({ search, rol: rolFilter, page: 1 })} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Matrícula</TableHead>
              <TableHead className="text-xs">Nombre</TableHead>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Rol</TableHead>
              <TableHead className="text-xs">Estado</TableHead>
              <TableHead className="text-xs w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No se encontraron usuarios.</TableCell></TableRow>
            ) : (
              usuarios.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs font-mono">{u.numero_control}</TableCell>
                  <TableCell className="text-xs font-medium">
                    {u.nombre} {u.apellido_paterno}
                    {u.grado_academico && <span className="text-muted-foreground ml-1">({u.grado_academico})</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${
                      u.rol === "administrativo" ? "border-primary text-foreground" :
                      u.rol === "asesor" ? "border-amber-200 text-amber-700" :
                      "border-border text-muted-foreground"
                    }`}>{u.rol}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${u.activo ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(u)} title="Editar">
                      <Pencil className="w-4 h-4 text-foreground" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleToggle(u.id)} title={u.activo ? "Desactivar" : "Activar"}>
                      {u.activo ? <ShieldX className="w-4 h-4 text-rose-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(u.id)} title="Eliminar">
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-rose-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => visit({ search, rol: rolFilter, page: page - 1 })}>Anterior</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => visit({ search, rol: rolFilter, page: page + 1 })}>Siguiente</Button>
          </div>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
            <DialogDescription>Registra un nuevo usuario en el sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <UsuarioFields
              data={formData}
              onChange={setFormData}
              passwordLabel="Contraseña *"
              opciones={opciones}
              docentes={docentes}
              opcion={opcionTitulacionSeleccionada}
              onOpcion={setOpcionTitulacionSeleccionada}
              asesor={asesorSeleccionado}
              onAsesor={setAsesorSeleccionado}
              asesorLabel="Asesor (opcional)"
            />
            <Button onClick={handleCreate} disabled={creating} className="w-full bg-primary text-primary-foreground">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear Usuario
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica los datos del usuario. Deja la contraseña en blanco para mantenerla.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <UsuarioFields
              data={editData}
              onChange={setEditData}
              passwordLabel="Nueva contraseña (dejar vacío para no cambiar)"
              passwordPlaceholder="••••••••"
              opciones={opciones}
              docentes={docentes}
              opcion={editOpcionSeleccionada}
              onOpcion={setEditOpcionSeleccionada}
              asesor={editAsesorSeleccionado}
              onAsesor={setEditAsesorSeleccionado}
              asesorLabel="Asesor"
            />
            <Button onClick={handleUpdate} disabled={updating} className="w-full bg-primary text-primary-foreground">
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente al usuario y todos sus datos asociados (trámites, documentos, asignaciones). No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

AdminUsuarios.layout = adminLayout;
