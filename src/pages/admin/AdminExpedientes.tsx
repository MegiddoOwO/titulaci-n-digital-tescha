import { useState } from "react";
import { Search, ArrowUpDown, Eye, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdmin } from "@/hooks/useAdmin";

const semaforoColor: Record<string, string> = {
  verde: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ambar: "bg-amber-100 text-amber-800 border-amber-200",
  rojo: "bg-rose-100 text-rose-800 border-rose-200",
};

const AdminExpedientes = () => {
  const [search, setSearch] = useState("");
  const [estatusFilter, setEstatusFilter] = useState("todos");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { listarExpedientes, detalleExpediente, aprobarDoc, rechazarDoc } = useAdmin();

  const { data, isLoading } = listarExpedientes({
    search: search || undefined,
    estatus: estatusFilter === "todos" ? undefined : estatusFilter,
    page,
  });

  const detalle = detalleExpediente(selectedId);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Expedientes</h1>
        <p className="text-muted-foreground font-body text-sm">Gestiona los trámites de titulación</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de control o nombre..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={estatusFilter} onValueChange={(v) => { setEstatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="en_revision">En Revisión</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-body text-xs">Matrícula</TableHead>
              <TableHead className="font-body text-xs">Estudiante</TableHead>
              <TableHead className="font-body text-xs">Opción</TableHead>
              <TableHead className="font-body text-xs">Avance</TableHead>
              <TableHead className="font-body text-xs">Revisión</TableHead>
              <TableHead className="font-body text-xs">Estado</TableHead>
              <TableHead className="font-body text-xs w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-navy" />
                </TableCell>
              </TableRow>
            ) : data?.expedientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                  No se encontraron expedientes.
                </TableCell>
              </TableRow>
            ) : (
              data?.expedientes.map((exp) => (
                <TableRow key={exp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(exp.id)}>
                  <TableCell className="font-body text-sm font-mono">{exp.numero_control}</TableCell>
                  <TableCell className="font-body text-sm font-medium">{exp.nombre_completo}</TableCell>
                  <TableCell className="font-body text-xs text-muted-foreground">{exp.opcion_titulacion}</TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <Progress value={exp.porcentaje} className="h-1.5 flex-1" />
                      <span className="font-body text-[11px] text-muted-foreground w-8">{exp.porcentaje}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(exp.docs_cargados + exp.docs_en_revision) > 0 && (
                      <Badge className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 cursor-help" title={`${exp.docs_cargados} cargados, ${exp.docs_en_revision} en revisión`}>
                        {exp.docs_cargados + exp.docs_en_revision} por revisar
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${semaforoColor[exp.color_semaforo] || "bg-gray-100"}`}>
                      {exp.estatus.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Página {data.page} de {data.totalPages} ({data.total} expedientes)
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Anterior
            </Button>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Expediente {detalle.data?.id}
              <span className="ml-2 text-sm text-muted-foreground font-normal">
                — {detalle.data?.opcion_titulacion}
              </span>
            </DialogTitle>
            <DialogDescription className="font-body text-sm">
              {detalle.data?.titulo_proyecto || "Sin título de proyecto"}
            </DialogDescription>
          </DialogHeader>
          {detalle.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  detalle.data?.progreso.color_semaforo === "verde" ? "bg-emerald-500" :
                  detalle.data?.progreso.color_semaforo === "rojo" ? "bg-rose-500" : "bg-amber-500"
                }`} />
                <span className="text-xs font-medium">{detalle.data?.estatus.replace(/_/g, " ")}</span>
                <span className="text-xs text-muted-foreground">— {detalle.data?.progreso.porcentaje}%</span>
              </div>
              {detalle.data?.documentos.map((doc) => (
                <div
                  key={doc.tipo_documento_id}
                  className={`p-3 rounded-lg border flex items-center justify-between ${
                    doc.estatus === "aprobado" ? "bg-emerald-50/50 border-emerald-200" :
                    doc.estatus === "rechazado" ? "bg-rose-50/50 border-rose-200" :
                    doc.estatus === "pendiente" ? "bg-gray-50/50" :
                    "bg-blue-50/50 border-blue-100"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">
                      {doc.tipo_documento_nombre}
                      {doc.tipo_documento_obligatorio === 1 && <span className="text-rose-500 ml-0.5">*</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {doc.fecha_subida
                        ? `Subido: ${new Date(doc.fecha_subida).toLocaleDateString("es-MX")} | ${doc.archivo_nombre || ""}`
                        : "No subido aún"}
                      {doc.estatus === "rechazado" && doc.motivo_rechazo && (
                        <span className="text-rose-600 block">Motivo: {doc.motivo_rechazo}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-[10px] ${
                      doc.estatus === "aprobado" ? "bg-emerald-100 text-emerald-700" :
                      doc.estatus === "rechazado" ? "bg-rose-100 text-rose-700" :
                      doc.estatus === "cargado" ? "bg-blue-100 text-blue-700" :
                      doc.estatus === "en_revision" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {doc.estatus === "cargado" ? "Recibido" : doc.estatus === "en_revision" ? "En Revisión" : doc.estatus}
                    </Badge>
                    {doc.id && (
                      <>
                        {doc.estatus !== "aprobado" && doc.estatus !== "rechazado" && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => aprobarDoc.mutate(doc.id!)}
                              disabled={aprobarDoc.isPending}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-[10px]"
                              onClick={() => {
                                const motivo = prompt("Motivo del rechazo:");
                                if (motivo) rechazarDoc.mutate({ docId: doc.id!, motivo });
                              }}
                              disabled={rechazarDoc.isPending}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px]"
                          onClick={() => {
                            const token = localStorage.getItem("sca_token");
                            window.open(`/api/tramites/${detalle.data!.id}/documentos/${doc.id}?token=${token}`, "_blank");
                          }}
                        >
                          Ver
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExpedientes;
