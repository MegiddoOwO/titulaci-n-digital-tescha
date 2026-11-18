import { useState } from "react";
import { Head, router } from "@inertiajs/react";
import { Search, UserPlus, Loader2, Power, PowerOff, Pencil, Trash2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
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
  idPrefix: string;
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

const ROL_LABEL: Record<string, string> = {
  estudiante: "Estudiante",
  asesor: "Asesor",
  administrativo: "Administrativo",
};

function Field({ id, label, className, children }: { id: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label htmlFor={id} className="text-xs font-semibold">{label}</label>
      {children}
    </div>
  );
}

/** Fields shared by the create and edit dialogs (identical layout in the legacy page). */
function UsuarioFields({
  idPrefix, data, onChange, passwordLabel, passwordPlaceholder, opciones, docentes, opcion, onOpcion, asesor, onAsesor, asesorLabel,
}: FieldsProps) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={id("matricula")} label="Matrícula *">
          <Input id={id("matricula")} value={data.numero_control} onChange={(e) => onChange({ ...data, numero_control: e.target.value })} />
        </Field>
        <Field id={id("rol")} label="Rol *">
          <Select value={data.rol} onValueChange={(v) => onChange({ ...data, rol: v as Rol })}>
            <SelectTrigger id={id("rol")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="estudiante">Estudiante</SelectItem>
              <SelectItem value="asesor">Asesor</SelectItem>
              <SelectItem value="administrativo">Administrativo</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field id={id("email")} label="Email *">
        <Input id={id("email")} type="email" value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} />
      </Field>
      <Field id={id("password")} label={passwordLabel}>
        <Input
          id={id("password")}
          type="password"
          autoComplete="new-password"
          value={data.password}
          onChange={(e) => onChange({ ...data, password: e.target.value })}
          placeholder={passwordPlaceholder}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id={id("nombre")} label="Nombre *">
          <Input id={id("nombre")} value={data.nombre} onChange={(e) => onChange({ ...data, nombre: e.target.value })} />
        </Field>
        <Field id={id("paterno")} label="Apellido Paterno *">
          <Input id={id("paterno")} value={data.apellido_paterno} onChange={(e) => onChange({ ...data, apellido_paterno: e.target.value })} />
        </Field>
      </div>
      <Field id={id("materno")} label="Apellido Materno">
        <Input id={id("materno")} value={data.apellido_materno} onChange={(e) => onChange({ ...data, apellido_materno: e.target.value })} />
      </Field>
      {data.rol === "estudiante" && (
        <>
          <Field id={id("opcion")} label="Opción de Titulación">
            <Select value={opcion} onValueChange={onOpcion}>
              <SelectTrigger id={id("opcion")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {opciones.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id={id("asesor")} label={asesorLabel}>
            <Select value={asesor} onValueChange={onAsesor}>
              <SelectTrigger id={id("asesor")}><SelectValue placeholder="Sin asesor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin asesor</SelectItem>
                {docentes.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)} disabled={d.carga_actual >= (d.carga_maxima || 5)}>
                    {d.nombre_completo} ({d.carga_actual}/{d.carga_maxima || 5})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </>
      )}
      {data.rol === "asesor" && (
        <Field id={id("grado")} label="Grado Académico">
          <Input
            id={id("grado")}
            value={data.grado_academico}
            onChange={(e) => onChange({ ...data, grado_academico: e.target.value })}
            placeholder="Mtra., Dr., etc."
          />
        </Field>
      )}
    </>
  );
}

export default function AdminUsuarios({ usuarios, total, page, totalPages, filters, docentes, opciones }: Props) {
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

  const hasFilters = search.trim() !== "" || rolFilter !== "todos";

  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)] content-start gap-4 px-4 py-6 sm:px-8">
      <Head title="Usuarios" />
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-2xl font-extrabold">Usuarios</h1>
          <p className="tnum text-sm text-muted-foreground">
            {total} {total === 1 ? "usuario" : "usuarios"}
            {hasFilters ? " con los filtros aplicados" : " en el sistema"}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <UserPlus aria-hidden="true" /> Nuevo usuario
        </Button>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label="Buscar usuarios"
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
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por rol">
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
          {loading ? <Loader2 className="animate-spin" aria-label="Buscando" /> : "Buscar"}
        </Button>
      </div>

      <section className="min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground" aria-label="Lista de usuarios">
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Cargando usuarios...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <Users className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold">No se encontraron usuarios.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {hasFilters
                ? "Prueba con otro número de control, nombre o email, o quita el filtro de rol."
                : "Cuando registres usuarios con \"Nuevo usuario\", aparecerán en esta lista."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden lg:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Rol</TableHead>
                <TableHead className="hidden md:table-cell">Estado</TableHead>
                <TableHead className="w-px"><span className="sr-only">Acciones</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((u) => {
                const nombre = `${u.nombre} ${u.apellido_paterno}`;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="py-2.5">
                      <p className="text-sm font-semibold leading-snug">
                        {nombre}
                        {u.grado_academico && <span className="ml-1 font-normal text-muted-foreground">({u.grado_academico})</span>}
                      </p>
                      <p className="tnum text-xs text-muted-foreground">
                        {u.numero_control}
                        <span className="md:hidden"> · {ROL_LABEL[u.rol] ?? u.rol}</span>
                      </p>
                      <p className="mt-0.5 break-all text-xs text-muted-foreground lg:hidden">{u.email}</p>
                      <div className="mt-1 md:hidden">
                        <StatusBadge kind="cuenta" status={u.activo ? "activo" : "inactivo"} />
                      </div>
                    </TableCell>
                    <TableCell className="hidden py-2.5 text-sm text-muted-foreground lg:table-cell">{u.email}</TableCell>
                    <TableCell className="hidden py-2.5 text-sm md:table-cell">{ROL_LABEL[u.rol] ?? u.rol}</TableCell>
                    <TableCell className="hidden py-2.5 md:table-cell">
                      <StatusBadge kind="cuenta" status={u.activo ? "activo" : "inactivo"} />
                    </TableCell>
                    <TableCell className="py-2.5 pr-3 align-top md:align-middle">
                      <div className="flex flex-nowrap items-center justify-end gap-0.5">
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => handleEdit(u)} aria-label={`Editar a ${nombre}`} title="Editar">
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
                          onClick={() => handleToggle(u.id)}
                          aria-label={`${u.activo ? "Desactivar" : "Activar"} a ${nombre}`}
                          title={u.activo ? "Desactivar" : "Activar"}
                        >
                          {u.activo ? <PowerOff aria-hidden="true" /> : <Power aria-hidden="true" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteId(u.id)}
                          aria-label={`Eliminar a ${nombre}`}
                          title="Eliminar"
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Paginación">
          <span className="tnum text-xs text-muted-foreground">Página {page} de {totalPages} ({total} usuarios)</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => visit({ search, rol: rolFilter, page: page - 1 })}>Anterior</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => visit({ search, rol: rolFilter, page: page + 1 })}>Siguiente</Button>
          </div>
        </nav>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>Registra un nuevo usuario en el sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <UsuarioFields
              idPrefix="nuevo"
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
            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Crear Usuario
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifica los datos del usuario. Deja la contraseña en blanco para mantenerla.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <UsuarioFields
              idPrefix="editar"
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
            <Button onClick={handleUpdate} disabled={updating} className="w-full">
              {updating ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
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
              {deleting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

AdminUsuarios.layout = adminLayout;
