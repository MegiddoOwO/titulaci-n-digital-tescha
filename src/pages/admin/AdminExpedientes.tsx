import { useState } from "react";
import { Search, Eye, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const expedientes = [
  { id: "EXP-001", name: "María García López", matricula: "20190001", modalidad: "Tesis", progress: 100, status: "listo", docs: 5 },
  { id: "EXP-002", name: "Carlos Hernández Ruiz", matricula: "20190015", modalidad: "EGEL", progress: 80, status: "revision", docs: 4 },
  { id: "EXP-003", name: "Ana Martínez Torres", matricula: "20190023", modalidad: "Residencia", progress: 60, status: "documentacion", docs: 3 },
  { id: "EXP-004", name: "Luis Sánchez Pérez", matricula: "20190042", modalidad: "Tesis", progress: 40, status: "documentacion", docs: 2 },
  { id: "EXP-005", name: "Rosa Jiménez Castro", matricula: "20190055", modalidad: "Promedio", progress: 100, status: "dictamen", docs: 5 },
  { id: "EXP-006", name: "Pedro López Díaz", matricula: "20190061", modalidad: "EGEL", progress: 20, status: "registro", docs: 1 },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  registro: { label: "Registro", variant: "secondary" },
  documentacion: { label: "Documentación", variant: "outline" },
  revision: { label: "En revisión", variant: "outline" },
  listo: { label: "Listo", variant: "default" },
  dictamen: { label: "Dictamen", variant: "default" },
};

const AdminExpedientes = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof expedientes[0] | null>(null);

  const filtered = expedientes.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.matricula.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Expedientes</h1>
          <p className="text-muted-foreground font-body text-sm">{expedientes.length} egresados registrados</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o matrícula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64 h-9 font-body text-sm"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1 font-body">
            <Filter className="w-3.5 h-3.5" /> Filtrar <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-body text-xs font-semibold">ID</TableHead>
              <TableHead className="font-body text-xs font-semibold">Egresado</TableHead>
              <TableHead className="font-body text-xs font-semibold">Matrícula</TableHead>
              <TableHead className="font-body text-xs font-semibold">Modalidad</TableHead>
              <TableHead className="font-body text-xs font-semibold">Progreso</TableHead>
              <TableHead className="font-body text-xs font-semibold">Estatus</TableHead>
              <TableHead className="font-body text-xs font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((exp) => (
              <TableRow key={exp.id} className="hover:bg-muted/30">
                <TableCell className="font-body text-sm font-mono text-muted-foreground">{exp.id}</TableCell>
                <TableCell className="font-body text-sm font-medium">{exp.name}</TableCell>
                <TableCell className="font-body text-sm text-muted-foreground">{exp.matricula}</TableCell>
                <TableCell className="font-body text-sm">{exp.modalidad}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={exp.progress} className="h-1.5 w-16" />
                    <span className="font-body text-xs text-muted-foreground">{exp.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusMap[exp.status].variant} className="font-body text-[10px]">
                    {statusMap[exp.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-7 gap-1 font-body text-xs" onClick={() => setSelected(exp)}>
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Expediente {selected?.id}</DialogTitle>
            <DialogDescription className="font-body">Detalle del expediente de titulación</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-body text-xs text-muted-foreground">Egresado</p>
                  <p className="font-body text-sm font-medium">{selected.name}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">Matrícula</p>
                  <p className="font-body text-sm font-medium">{selected.matricula}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">Modalidad</p>
                  <p className="font-body text-sm font-medium">{selected.modalidad}</p>
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">Documentos</p>
                  <p className="font-body text-sm font-medium">{selected.docs}/5 entregados</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-body text-xs font-medium">Progreso general</span>
                  <span className="font-body text-xs text-muted-foreground">{selected.progress}%</span>
                </div>
                <Progress value={selected.progress} className="h-2" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-navy-light font-body" onClick={() => setSelected(null)}>
                  Aprobar Documentos
                </Button>
                <Button variant="outline" className="flex-1 font-body" onClick={() => setSelected(null)}>
                  Solicitar Corrección
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExpedientes;
