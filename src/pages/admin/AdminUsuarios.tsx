import { useState } from "react";
import { Search, UserPlus, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { useAdmin } from "@/hooks/useAdmin";
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

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("sca_token");
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (rolFilter !== "todos") qs.set("rol", rolFilter);
      qs.set("page", String(page));
      const res = await fetch(`/api/admin/usuarios?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsuarios(data);
    } catch { /* */ }
    setLoading(false);
  };

  useState(() => { fetchUsuarios(); });

  const handleCreate = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem("sca_token");
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Usuario creado", description: data.message });
      setShowCreate(false);
      setFormData({ numero_control: "", email: "", password: "", nombre: "", apellido_paterno: "", apellido_materno: "", rol: "estudiante", grado_academico: "", carga_maxima: 5 });
      fetchUsuarios();
    } catch (err: unknown) {
      toast({ title: "Error", description: (err as Error).message, className: "bg-destructive text-destructive-foreground" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const token = localStorage.getItem("sca_token");
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
                <TableRow key={u.id}>
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
                      onClick={() => handleToggle(u.id)}
                      title={u.activo ? "Desactivar" : "Activar"}
                    >
                      {u.activo ? <ShieldX className="w-4 h-4 text-rose-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
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
    </div>
  );
};

export default AdminUsuarios;
