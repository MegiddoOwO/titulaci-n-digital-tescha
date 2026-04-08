import { useState } from "react";
import { FileText, CheckCircle2, XCircle, Clock, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const documents = [
  { id: 1, student: "María García López", document: "Acta de Nacimiento", date: "05/04/2026", status: "pending" },
  { id: 2, student: "María García López", document: "Certificado de Estudios", date: "05/04/2026", status: "pending" },
  { id: 3, student: "Carlos Hernández Ruiz", document: "Comprobante de Pago", date: "04/04/2026", status: "pending" },
  { id: 4, student: "Ana Martínez Torres", document: "Fotografías", date: "03/04/2026", status: "approved" },
  { id: 5, student: "Luis Sánchez Pérez", document: "Constancia de No Adeudo", date: "02/04/2026", status: "rejected" },
  { id: 6, student: "Rosa Jiménez Castro", document: "Certificado de Estudios", date: "01/04/2026", status: "approved" },
];

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; colorClass: string }> = {
  pending: { label: "Pendiente", icon: Clock, colorClass: "text-warning" },
  approved: { label: "Aprobado", icon: CheckCircle2, colorClass: "text-success" },
  rejected: { label: "Rechazado", icon: XCircle, colorClass: "text-destructive" },
};

const AdminDocumentos = () => {
  const [docs, setDocs] = useState(documents);
  const { toast } = useToast();

  const updateStatus = (id: number, status: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    toast({
      title: status === "approved" ? "Documento aprobado" : "Documento rechazado",
      description: `El documento ha sido ${status === "approved" ? "aprobado" : "rechazado"} exitosamente.`,
    });
  };

  const pending = docs.filter((d) => d.status === "pending");
  const reviewed = docs.filter((d) => d.status !== "pending");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Revisión de Documentos</h1>
        <p className="text-muted-foreground font-body text-sm">{pending.length} documentos pendientes de revisión</p>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Pendientes de Revisión</h2>
          {pending.map((doc) => (
            <Card key={doc.id} className="border-warning/30">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold-light rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <p className="font-body text-sm font-medium text-foreground">{doc.document}</p>
                    <p className="font-body text-xs text-muted-foreground">{doc.student} · {doc.date}</p>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                  <Button variant="outline" size="sm" className="h-8 gap-1 font-body text-xs">
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </Button>
                  <Button size="sm" className="h-8 gap-1 font-body text-xs bg-success/90 hover:bg-success text-background" onClick={() => updateStatus(doc.id, "approved")}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
                  </Button>
                  <Button variant="destructive" size="sm" className="h-8 gap-1 font-body text-xs" onClick={() => updateStatus(doc.id, "rejected")}>
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Revisados</h2>
          {reviewed.map((doc) => {
            const config = statusConfig[doc.status];
            const Icon = config.icon;
            return (
              <Card key={doc.id} className="border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${config.colorClass} flex-shrink-0`} />
                    <div>
                      <p className="font-body text-sm font-medium text-foreground">{doc.document}</p>
                      <p className="font-body text-xs text-muted-foreground">{doc.student} · {doc.date}</p>
                    </div>
                  </div>
                  <Badge variant={doc.status === "approved" ? "default" : "destructive"} className="font-body text-[10px]">
                    {config.label}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDocumentos;
