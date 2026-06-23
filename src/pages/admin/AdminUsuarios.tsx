import { useState, useEffect } from "react";
import { Search, UserPlus, Loader2, ShieldCheck, ShieldX, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { getToken } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const AdminUsuarios = () => {
  const [search, setSearch] = useState("");
  const [rolFilter, setRolFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    numero_control: "", email: "", password: "", nombre: "", apellido_paterno: "",
    apellido_materno: "", rol: "estudiante" as "estudiante" | "asesor" | "administrativo",
    grado_academico: "", carga_maxima: 5,
  });
  const [creating, setCreating] = useState(false);
  const [usuarios, setUsuarios] = useState<{
    usuarios: { id: number; numero_control: string; email: string; nombre: string; apellido_paterno: string; apellido_materno: string | null; rol: string; activo: number; grado_academico: string | null; carga_maxima: number | null }[];
    total: number; page: number; totalPages: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [docentes, setDocentes] = useState<{ id: number; nombre_completo: string; carga_actual: number; carga_maxima: number | null }[]>([]);
  const [asesorSeleccionado, setAsesorSeleccionado] = useState("none");
  const [opcionesTitulacion, setOpcionesTitulacion] = useState<{ id: number; nombre: string }[]>([]);
  const [opcionTitulacionSeleccionada, setOpcionTitulacionSeleccionada] = useState("1");

  useEffect(() => {
    const token = getToken();
    fetch("/api/admin/docentes", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setDocentes);
    fetch("/api/admin/opciones-titulacion", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setOpcionesTitulacion);
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (rolFilter !== "todos") qs.set("rol", rolFilter);
      qs.set("page", String(page));
      const res = await fetch(`/api/admin/usuarios?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsuarios(data);
    } catch { setUsuarios(null); }
    setLoading(false);
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleCreate = async () => {
    if (formData.rol === "estudiante" && asesorSeleccionado === "none" && !window.confirm("¿Crear estudiante sin asesor asignado? El asesor podrá asignarse después.")) {
      return;
    }
    setCreating(true);
    try {
      const token = getToken();
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, asesor_id: asesorSeleccionado !== "none" ? asesorSeleccionado : undefined, opcion_titulacion_id: opcionTitulacionSeleccionada }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Usuario creado", description: data.message });
      setShowCreate(false);
      setFormData({ numero_control: "", email: "", password: "", nombre: "", apellido_paterno: "", apellido_materno: "", rol: "estudiante", grado_academico: "", carga_maxima: 5 });
      setAsesorSeleccionado("none");
      setOpcionTitulacionSeleccionada("1");
      fetchUsuarios();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/usuarios/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: data.message });
      fetchUsuarios();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    }
  };

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/usuarios/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: data.message });
      setDeleteId(null);
      fetchUsuarios();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally {
      setDeleting(false);
    }
  };

  // Edición de usuario
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState({
    numero_control: "", email: "", nombre: "", apellido_paterno: "", apellido_materno: "",
    rol: "estudiante" as string, grado_academico: "", carga_maxima: 5, password: "",
  });
  const [editAsesorSeleccionado, setEditAsesorSeleccionado] = useState("none");
  const [editOpcionSeleccionada, setEditOpcionSeleccionada] = useState("1");
  const [editTramiteId, setEditTramiteId] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleEdit = async (user: Record<string, unknown>) => {
    setEditId(user.id as number);
    setEditData({
      numero_control: (user.numero_control as string) || "",
      email: (user.email as string) || "",
      nombre: (user.nombre as string) || "",
      apellido_paterno: (user.apellido_paterno as string) || "",
      apellido_materno: (user.apellido_materno as string) || "",
      rol: (user.rol as string) || "estudiante",
      grado_academico: (user.grado_academico as string) || "",
      carga_maxima: (user.carga_maxima as number) || 5,
      password: "",
    });
    setEditAsesorSeleccionado("none");
    setEditOpcionSeleccionada("1");
    setEditTramiteId(null);

    if (user.rol === "estudiante") {
      const token = getToken();
      try {
        const res = await fetch(`/api/admin/expedientes?search=${user.numero_control}&limit=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const tramiteId = data.expedientes?.[0]?.id;

          if (tramiteId) {
            setEditTramiteId(tramiteId);
            const detalle = await fetch(`/api/admin/expedientes/${tramiteId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const tramite = await detalle.json();
          const asesor = (tramite.asignaciones as { usuario_id?: number }[] | undefined)?.find(a => a.usuario_id);
          if (asesor?.usuario_id) setEditAsesorSeleccionado(String(asesor.usuario_id));
          if (tramite.opcion_titulacion_id) setEditOpcionSeleccionada(String(tramite.opcion_titulacion_id));
        }
      } catch { /* best effort */ }
    }

    setShowEdit(true);
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const token = getToken();
      const body: Record<string, unknown> = {
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

      const res = await fetch(`/api/admin/usuarios/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (editData.rol === "estudiante" && editTramiteId) {
        if (editAsesorSeleccionado !== "none") {
          await fetch("/api/admin/asignaciones", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              tramite_id: editTramiteId,
              usuario_id: parseInt(editAsesorSeleccionado),
              rol_asignacion: "asesor",
            }),
          });
        }
        if (editOpcionSeleccionada) {
          await fetch(`/api/admin/expedientes/${editTramiteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ opcion_titulacion_id: parseInt(editOpcionSeleccionada) }),
          });
        }
      }

      toast({ title: "Usuario actualizado", description: data.message });
      setShowEdit(false);
      fetchUsuarios();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground font-body text-sm">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-navy text-white hover:bg-navy/90 gap-2">
          <UserPlus className="w-4 h-4" /> Nuevo Usuario
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de control, nombre o email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && fetchUsuarios()}
          />
        </div>
        <Select value={rolFilter} onValueChange={(v) => { setRolFilter(v); setPage(1); }}>
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
        <Button variant="outline" onClick={fetchUsuarios} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
        </Button>
      </div>

      <div className="border rounded-lg bg-white">
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
            ) : !usuarios || usuarios.usuarios.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No se encontraron usuarios.</TableCell></TableRow>
            ) : (
              usuarios.usuarios.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs font-mono">{u.numero_control}</TableCell>
                  <TableCell className="text-xs font-medium">
                    {u.nombre} {u.apellido_paterno}
                    {u.grado_academico && <span className="text-muted-foreground ml-1">({u.grado_academico})</span>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${
                      u.rol === "administrativo" ? "border-navy text-navy" :
                      u.rol === "asesor" ? "border-amber-200 text-amber-700" :
                      "border-gray-200 text-gray-600"
                    }`}>{u.rol}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${u.activo ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => handleEdit(u as unknown as Record<string, unknown>)}
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4 text-navy" />
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => handleToggle(u.id)}
                      title={u.activo ? "Desactivar" : "Activar"}
                    >
                      {u.activo ? <ShieldX className="w-4 h-4 text-rose-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                    </Button>
                    <Button
                      size="sm" variant="ghost"
                      onClick={() => setDeleteId(u.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {usuarios && usuarios.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Página {usuarios.page} de {usuarios.totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => { setPage(p => p - 1); setTimeout(fetchUsuarios, 100); }}>Anterior</Button>
            <Button size="sm" variant="outline" disabled={page >= usuarios.totalPages} onClick={() => { setPage(p => p + 1); setTimeout(fetchUsuarios, 100); }}>Siguiente</Button>
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs">Matrícula *</label>
                <Input value={formData.numero_control} onChange={e => setFormData({ ...formData, numero_control: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs">Rol *</label>
                <Select value={formData.rol} onValueChange={v => setFormData({ ...formData, rol: v as typeof formData.rol })}>
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
              <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs">Contraseña *</label>
              <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="h-8 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs">Nombre *</label>
                <Input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs">Apellido Paterno *</label>
                <Input value={formData.apellido_paterno} onChange={e => setFormData({ ...formData, apellido_paterno: e.target.value })} className="h-8 text-xs" />
              </div>
            </div>
            <div>
              <label className="text-xs">Apellido Materno</label>
              <Input value={formData.apellido_materno} onChange={e => setFormData({ ...formData, apellido_materno: e.target.value })} className="h-8 text-xs" />
            </div>
            {formData.rol === "estudiante" && (
              <>
                <div>
                  <label className="text-xs">Opción de Titulación</label>
                  <Select value={opcionTitulacionSeleccionada} onValueChange={setOpcionTitulacionSeleccionada}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {opcionesTitulacion.map(o => (
                        <SelectItem key={o.id} value={String(o.id)}>{o.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs">Asesor (opcional)</label>
                  <Select value={asesorSeleccionado} onValueChange={setAsesorSeleccionado}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sin asesor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asesor</SelectItem>
                      {docentes.map(d => (
                        <SelectItem key={d.id} value={String(d.id)} disabled={d.carga_actual >= (d.carga_maxima || 5)}>
                          {d.nombre_completo} ({d.carga_actual}/{d.carga_maxima || 5})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {formData.rol === "asesor" && (
              <div>
                <label className="text-xs">Grado Académico</label>
                <Input value={formData.grado_academico} onChange={e => setFormData({ ...formData, grado_academico: e.target.value })} className="h-8 text-xs" placeholder="Mtra., Dr., etc." />
              </div>
            )}
            <Button onClick={handleCreate} disabled={creating} className="w-full bg-navy text-white">
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
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs">Matrícula *</label>
                <Input value={editData.numero_control} onChange={e => setEditData({ ...editData, numero_control: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs">Rol *</label>
                <Select value={editData.rol} onValueChange={v => setEditData({ ...editData, rol: v })}>
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
              <Input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-xs">Nueva contraseña (dejar vacío para no cambiar)</label>
              <Input type="password" value={editData.password} onChange={e => setEditData({ ...editData, password: e.target.value })} className="h-8 text-xs" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs">Nombre *</label>
                <Input value={editData.nombre} onChange={e => setEditData({ ...editData, nombre: e.target.value })} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs">Apellido Paterno *</label>
                <Input value={editData.apellido_paterno} onChange={e => setEditData({ ...editData, apellido_paterno: e.target.value })} className="h-8 text-xs" />
              </div>
            </div>
            <div>
              <label className="text-xs">Apellido Materno</label>
              <Input value={editData.apellido_materno} onChange={e => setEditData({ ...editData, apellido_materno: e.target.value })} className="h-8 text-xs" />
            </div>
            {editData.rol === "estudiante" && (
              <>
                <div>
                  <label className="text-xs">Opción de Titulación</label>
                  <Select value={editOpcionSeleccionada} onValueChange={setEditOpcionSeleccionada}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {opcionesTitulacion.map(o => (
                        <SelectItem key={o.id} value={String(o.id)}>{o.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs">Asesor</label>
                  <Select value={editAsesorSeleccionado} onValueChange={setEditAsesorSeleccionado}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sin asesor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asesor</SelectItem>
                      {docentes.map(d => (
                        <SelectItem key={d.id} value={String(d.id)} disabled={d.carga_actual >= (d.carga_maxima || 5)}>
                          {d.nombre_completo} ({d.carga_actual}/{d.carga_maxima || 5})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {editData.rol === "asesor" && (
              <div>
                <label className="text-xs">Grado Académico</label>
                <Input value={editData.grado_academico} onChange={e => setEditData({ ...editData, grado_academico: e.target.value })} className="h-8 text-xs" placeholder="Mtra., Dr., etc." />
              </div>
            )}
            <Button onClick={handleUpdate} disabled={updating} className="w-full bg-navy text-white">
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
};

export default AdminUsuarios;
