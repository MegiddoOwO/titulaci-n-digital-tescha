import { useState, useEffect } from "react";
import { Loader2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getToken } from "@/services/api";

interface BitacoraEntry {
  id: number;
  accion: string;
  entidad: string;
  entidad_id: number;
  detalle: string | null;
  ip_origen: string | null;
  fecha: string;
  usuario_nombre: string | null;
}

const AdminBitacora = () => {
  const [entries, setEntries] = useState<BitacoraEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchBitacora = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/bitacora?page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await res.json();
      setEntries(data.rows);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch { setEntries([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchBitacora(); }, [page]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Bitácora</h1>
        <p className="text-muted-foreground font-body text-sm">Registro de auditoría del sistema</p>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-base">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-navy" />
                {total} registros
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : entries.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No hay registros en la bitácora.</p>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 border-b border-gray-100 last:border-0"
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-navy" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{entry.accion}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {entry.entidad}
                        {entry.entidad_id ? ` #${entry.entidad_id}` : ""}
                      </span>
                    </div>
                    {entry.detalle && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono break-all">
                        {entry.detalle.substring(0, 200)}
                      </p>
                    )}
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {entry.usuario_nombre || "Sistema"}
                      {entry.ip_origen ? ` · IP: ${entry.ip_origen}` : ""}
                      {" · "}{new Date(entry.fecha).toLocaleString("es-MX")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  Anterior
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBitacora;
