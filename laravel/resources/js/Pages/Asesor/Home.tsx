import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { GraduationCap, Loader2, User, FileText, CheckCircle2, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { jsonRequest } from "@/lib/http";
import type { PageProps } from "@/types";

interface EstudianteAsignado {
  tramite_id: number;
  numero_control: string;
  nombre_completo: string;
  opcion_titulacion: string;
  estatus_tramite: string;
  rol_asignacion: string;
  porcentaje: number;
  color_semaforo: string;
}

interface DocumentoDetalle {
  id: number | null;
  tipo_documento_id: number;
  tipo_documento_nombre: string;
  estatus: string;
  tipo_documento_obligatorio: number;
  motivo_rechazo: string | null;
  archivo_nombre: string | null;
  fecha_subida: string | null;
}

interface ExpedienteDetalle {
  estatus: string;
  progreso: { color_semaforo: string; porcentaje: number };
  documentos: DocumentoDetalle[];
}

const semaforoColor: Record<string, string> = {
  verde: "bg-emerald-100 text-emerald-800 border-emerald-200",
  ambar: "bg-amber-100 text-amber-800 border-amber-200",
  rojo: "bg-rose-100 text-rose-800 border-rose-200",
};

export default function AsesorHome({ estudiantes }: PageProps<{ estudiantes: EstudianteAsignado[] }>) {
  const usuario = usePage<PageProps>().props.auth.user;
  const { toast } = useToast();
  const [selectedTramite, setSelectedTramite] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<ExpedienteDetalle | null>(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [rechazarDocId, setRechazarDocId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  // The detail is a read-only, on-demand JSON fetch: an Inertia visit would replace the page
  // props and URL on every selection, which the legacy master/detail layout never did.
  const loadDetalle = async (tramiteId: number, showSpinner = true) => {
    if (showSpinner) setDetalleLoading(true);
    try {
      setDetalle(await jsonRequest<ExpedienteDetalle>(`/asesor/expedientes/${tramiteId}`));
    } catch {
      setDetalle(null);
    } finally {
      setDetalleLoading(false);
    }
  };

  const selectTramite = (tramiteId: number) => {
    setSelectedTramite(tramiteId);
    void loadDetalle(tramiteId);
  };

  // Mutations go through Inertia: the redirect back re-sends `estudiantes` (progress/semaforo),
  // and the open detail is refetched afterwards.
  const review = (docId: number, action: "aprobar" | "rechazar", title: string, data: Record<string, string> = {}) => {
    router.put(`/asesor/documentos/${docId}/${action}`, data, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setPending(true),
      onFinish: () => setPending(false),
      onSuccess: () => {
        toast({ title });
        if (action === "rechazar") {
          setRechazarDocId(null);
          setMotivoRechazo("");
        }
        if (selectedTramite) void loadDetalle(selectedTramite, false);
      },
    });
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gradient-to-br from-[#faf6f0] to-[#efe1ca]/20">
      <Head title="Panel del Asesor" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Panel del Asesor</h1>
          <p className="text-muted-foreground font-body text-sm">
            Bienvenido, {usuario?.nombre || "Docente"}
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border shadow-sm">
          <GraduationCap className="w-5 h-5 text-navy" />
          <div>
            <p className="text-xs font-medium">{usuario?.email}</p>
            <p className="text-[10px] text-muted-foreground">{usuario?.numero_control}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              Estudiantes asignados ({estudiantes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estudiantes.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No tienes estudiantes asignados actualmente.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {estudiantes.map((est) => (
                  <div
                    key={est.tramite_id}
                    onClick={() => selectTramite(est.tramite_id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/30 ${
                      selectedTramite === est.tramite_id
                        ? "border-navy bg-navy/5"
                        : "border-border bg-white hover:border-navy/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-navy/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-navy" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{est.nombre_completo}</p>
                          <p className="text-[11px] text-muted-foreground">{est.numero_control}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[10px] ${
                            est.rol_asignacion === "asesor" ? "bg-navy/10 text-navy" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {est.rol_asignacion}
                        </Badge>
                        <Badge className={`text-[10px] transition-colors ${semaforoColor[est.color_semaforo] || "bg-gray-100"}`}>
                          {est.estatus_tramite.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground min-w-[100px]">{est.opcion_titulacion}</span>
                      <Progress value={est.porcentaje} className="h-1.5 flex-1" />
                      <span className="text-[11px] text-muted-foreground w-8 text-right">{est.porcentaje}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base">
              {selectedTramite ? "Detalle del expediente" : "Selecciona un estudiante"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedTramite ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Selecciona un estudiante para ver el detalle de su expediente.
                </p>
              </div>
            ) : detalleLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : detalle ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      detalle.progreso?.color_semaforo === "verde"
                        ? "bg-emerald-500"
                        : detalle.progreso?.color_semaforo === "rojo"
                        ? "bg-rose-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <span className="text-xs font-medium">{detalle.estatus?.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">— {detalle.progreso?.porcentaje}%</span>
                </div>
                {detalle.documentos?.map((doc) => (
                  <div
                    key={doc.tipo_documento_id}
                    className={`p-2 rounded border text-xs flex items-center justify-between gap-2 ${
                      doc.estatus === "aprobado"
                        ? "bg-emerald-50 border-emerald-200"
                        : doc.estatus === "rechazado"
                        ? "bg-rose-50 border-rose-200"
                        : doc.estatus === "pendiente"
                        ? "bg-gray-50"
                        : "bg-blue-50 border-blue-100"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium">{doc.tipo_documento_nombre}</span>
                      {doc.tipo_documento_obligatorio === 1 && <span className="text-rose-500 ml-0.5">*</span>}
                      {doc.archivo_nombre && (
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {doc.archivo_nombre}
                          {doc.fecha_subida ? ` · ${new Date(doc.fecha_subida).toLocaleDateString("es-MX")}` : ""}
                        </span>
                      )}
                      {doc.estatus === "rechazado" && doc.motivo_rechazo && (
                        <span className="text-rose-600 block text-[10px] mt-0.5">{doc.motivo_rechazo}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        className={`text-[9px] ${
                          doc.estatus === "aprobado"
                            ? "bg-emerald-100 text-emerald-700"
                            : doc.estatus === "rechazado"
                            ? "bg-rose-100 text-rose-700"
                            : doc.estatus === "cargado"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {doc.estatus}
                      </Badge>
                      {doc.id && doc.estatus !== "aprobado" && doc.estatus !== "rechazado" && (
                        <>
                          <Button
                            size="sm"
                            className="h-6 text-[9px] bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => review(doc.id!, "aprobar", "Documento aprobado")}
                            disabled={pending}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 text-[9px]"
                            onClick={() => setRechazarDocId(doc.id!)}
                          >
                            <Ban className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {rechazarDocId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="font-display text-base">Motivo del rechazo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe por qué se rechaza este documento..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setRechazarDocId(null); setMotivoRechazo(""); }}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!motivoRechazo.trim() || pending}
                  onClick={() => review(rechazarDocId, "rechazar", "Documento rechazado", { motivo: motivoRechazo.trim() })}
                >
                  {pending ? "Rechazando..." : "Confirmar rechazo"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
