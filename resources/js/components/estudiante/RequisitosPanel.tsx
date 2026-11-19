import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { megas } from "@/components/estudiante/helpers";
import type { DocumentoInfo } from "@/types/tramite";

const FOTO = [
  "Tamaño miñón (4.5 × 3.5 cm)",
  "Fondo blanco mate (sin brillos ni sombras)",
  "Camisa blanca formal",
  "Saco oscuro (negro o azul marino)",
  "Sin maquillaje visible",
  "Sin patillas largas (corte escolar)",
  "Sin lentes (ni oscuros ni de aumento)",
  "Frente completamente descubierta (sin fleco sobre cejas)",
  "Sin retoques digitales ni filtros",
  "Iluminación uniforme (sin sombras en el rostro)",
  "Pose frontal (mirando directamente a la cámara)",
  "Papel fotográfico mate (no brillante)",
];

const PAGO = [
  { title: "Ingresa al portal", desc: "Accede al Portal de Servicios al Contribuyente del Estado de México: sfpya.edomexico.gob.mx" },
  { title: "Selecciona el concepto", desc: "Elige 'Derechos de Titulación Nivel Superior' en el catálogo de servicios." },
  { title: "Genera la línea de captura", desc: "Completa tus datos. La referencia debe contener 18 dígitos. Verifica antes de continuar." },
  { title: "Realiza el pago", desc: "Paga en banco, tienda de conveniencia o banca en línea usando la línea de captura." },
  { title: "Sube el comprobante", desc: "Descarga el comprobante PDF y súbelo en la sección 'Documentos' de este panel." },
];

const Aviso = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-md border bg-muted px-3 py-2.5 text-sm">
    <span className="font-extrabold">Importante: </span>
    {children}
  </p>
);

/** Static requirements: photo specs, format and size per document, and the payment guide. */
export function RequisitosPanel({ documentos, opcion }: { documentos: DocumentoInfo[]; opcion: string }) {
  return (
    <div className="divide-y rounded-lg border bg-card">
      <section aria-labelledby="req-foto" className="grid gap-3 p-4">
        <div>
          <h2 id="req-foto" className="text-base font-extrabold">
            Especificaciones de fotografía
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Requisitos obligatorios para tu fotografía tamaño miñón. Si no cumples, será rechazada.
          </p>
        </div>
        <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {FOTO.map((req) => (
            <li key={req} className="flex gap-2">
              <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
              {req}
            </li>
          ))}
        </ul>
        <Aviso>
          Las fotografías que no cumplan con estas especificaciones serán rechazadas por el comité de titulación. Deberás repetir el
          gasto y volver a subirlas.
        </Aviso>
      </section>

      <section aria-labelledby="req-docs" className="grid gap-3 p-4">
        <div>
          <h2 id="req-docs" className="text-base font-extrabold">
            Requisitos por documento
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Formatos aceptados y tamaños máximos para cada documento de tu trámite de {opcion}.
          </p>
        </div>
        {documentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tu trámite aún no tiene documentos requeridos.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead className="text-right">Tamaño máx.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentos.map((d) => (
                <TableRow key={d.tipo_documento_id}>
                  <TableCell>
                    {d.tipo_documento_nombre}
                    {d.tipo_documento_obligatorio === 1 && <span className="block text-xs text-muted-foreground">Obligatorio</span>}
                  </TableCell>
                  <TableCell>{d.formato_permitido}</TableCell>
                  <TableCell className="tnum text-right">{megas(d.tamaño_max_mb)} MB</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section aria-labelledby="req-pago" className="grid gap-3 p-4">
        <div>
          <h2 id="req-pago" className="text-base font-extrabold">
            Guía de pago de derechos
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Sigue estos pasos para generar correctamente tu línea de captura en el portal estatal.</p>
        </div>
        <ol className="grid gap-3">
          {PAGO.map((p, i) => (
            <li key={p.title} className="grid grid-cols-[1.75rem_1fr] gap-2 text-sm">
              <span className="tnum flex h-7 w-7 items-center justify-center rounded-full border text-xs font-extrabold" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold">
                  <span className="sr-only">Paso {i + 1}: </span>
                  {p.title}
                </p>
                <p className="text-muted-foreground">{p.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <Aviso>La referencia bancaria debe tener exactamente 18 dígitos. Una referencia incorrecta invalidará tu pago.</Aviso>
      </section>
    </div>
  );
}
