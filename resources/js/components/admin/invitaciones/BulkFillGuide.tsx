import { ChevronDown } from "lucide-react";

interface Opcion {
  id: number;
  nombre: string;
}

interface Asesor {
  id: number;
  numero_control?: string;
  nombre_completo: string;
  carga_actual: number;
  carga_maxima: number | null;
}

interface Props {
  maxRows: number;
  opciones: Opcion[];
  asesores: Asesor[];
}

interface Column {
  name: string;
  required: string;
  what: string;
  example: string;
}

const DEFAULT_MAX_LOAD = 5;

/** Collapsible "how to fill the file" guide for step 1; rules mirror InvitacionMasivaService. */
export function BulkFillGuide({ maxRows, opciones, asesores }: Props) {
  const opcionEjemplo = opciones[0]?.nombre ?? "Tesis profesional";
  const asesorEjemplo = asesores.find((a) => a.numero_control)?.numero_control ?? "DOC-0001";

  const columns: Column[] = [
    { name: "numero_control", required: "Sí", what: "Matrícula o clave de la persona (hasta 20 caracteres). No puede repetirse ni existir ya.", example: "2024-0123" },
    { name: "correo", required: "Sí", what: "Correo al que llega la invitación. No puede repetirse.", example: "ana.lopez@tescha.edu.mx" },
    { name: "nombre", required: "Sí", what: "Nombre o nombres.", example: "Ana" },
    { name: "apellido_paterno", required: "Sí", what: "Primer apellido.", example: "López" },
    { name: "apellido_materno", required: "No", what: "Segundo apellido. Puede quedar vacío.", example: "Ruiz" },
    { name: "rol", required: "Sí", what: "estudiante, asesor o administrativo. No importan mayúsculas ni acentos.", example: "estudiante" },
    { name: "opcion_titulacion", required: "Solo estudiantes", what: "Nombre de una opción de la lista de abajo, escrito igual. No importan mayúsculas ni acentos.", example: opcionEjemplo },
    { name: "asesor", required: "No (solo estudiantes)", what: "Número de control de un asesor activo. Si ya tiene su carga máxima, la fila se rechaza.", example: asesorEjemplo },
    { name: "grado_academico", required: "No (solo asesores)", what: "Grado del asesor. Se ignora en otros roles.", example: "Maestría" },
  ];

  const exampleRow = ["2024-0123", "ana.lopez@tescha.edu.mx", "Ana", "López", "Ruiz", "estudiante", opcionEjemplo, asesorEjemplo, ""]
    .map((v) => (/[",]/.test(v) ? `"${v}"` : v))
    .join(",");

  return (
    <details open className="group rounded-md border bg-card">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 text-sm font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        ¿Cómo llenar el archivo?
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
      </summary>

      <div className="min-w-0 space-y-4 border-t px-3 py-3 text-sm">
        <ol className="list-inside list-decimal space-y-1">
          <li>Descarga la plantilla.</li>
          <li>Escribe una persona por fila, debajo de los encabezados, sin cambiar sus nombres.</li>
          <li>Guarda el archivo y súbelo aquí: se revisa completo antes de crear nada.</li>
        </ol>

        <section aria-label="Columnas del archivo" className="space-y-2">
          <h4 className="text-xs font-extrabold">Columnas</h4>

          <dl className="space-y-2 sm:hidden">
            {columns.map((c) => (
              <div key={c.name} className="rounded-md border p-2.5">
                <dt className="break-all font-mono text-xs font-bold">{c.name}</dt>
                <dd className="mt-1 space-y-0.5 text-xs">
                  <p><span className="font-semibold">Obligatoria: </span>{c.required}</p>
                  <p>{c.what}</p>
                  <p><span className="font-semibold">Ejemplo: </span><span className="break-all font-mono">{c.example}</span></p>
                </dd>
              </div>
            ))}
          </dl>

          <div className="hidden overflow-hidden rounded-md border sm:block">
            <table className="w-full table-fixed text-left text-xs">
              <caption className="sr-only">Columnas del archivo de invitaciones</caption>
              <thead className="bg-muted/40">
                <tr>
                  <th scope="col" className="w-[24%] px-2.5 py-2 font-semibold">Columna</th>
                  <th scope="col" className="w-[17%] px-2.5 py-2 font-semibold">¿Obligatoria?</th>
                  <th scope="col" className="px-2.5 py-2 font-semibold">Qué escribir</th>
                  <th scope="col" className="w-[24%] px-2.5 py-2 font-semibold">Ejemplo</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((c) => (
                  <tr key={c.name} className="border-t align-top">
                    <th scope="row" className="break-words px-2.5 py-2 font-mono font-bold">{c.name}</th>
                    <td className="px-2.5 py-2">{c.required}</td>
                    <td className="px-2.5 py-2">{c.what}</td>
                    <td className="break-all px-2.5 py-2 font-mono">{c.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tnum text-xs text-muted-foreground">Hasta {maxRows} filas por archivo.</p>
        </section>

        <section aria-label="Opciones válidas" className="space-y-1">
          <h4 className="text-xs font-extrabold">Opciones válidas de opcion_titulacion</h4>
          {opciones.length > 0 ? (
            <p className="text-xs">{opciones.map((o) => o.nombre).join(" · ")}</p>
          ) : (
            <p className="text-xs text-muted-foreground">No hay opciones activas. Ver hoja Catálogos de la plantilla Excel.</p>
          )}
        </section>

        {asesores.length > 0 && (
          <section aria-label="Asesores disponibles" className="space-y-1">
            <h4 className="text-xs font-extrabold">Asesores para la columna asesor</h4>
            <ul
              tabIndex={0}
              aria-label="Asesores activos con su carga"
              className="max-h-28 space-y-0.5 overflow-y-auto rounded-md border bg-background p-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {asesores.map((a) => (
                <li key={a.id}>
                  <span className="font-mono font-semibold">{a.numero_control ?? "—"}</span> · {a.nombre_completo}{" "}
                  <span className="tnum text-muted-foreground">(carga {a.carga_actual} de {a.carga_maxima ?? DEFAULT_MAX_LOAD})</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-label="Ejemplo de fila" className="space-y-1">
          <h4 className="text-xs font-extrabold">Así se ve una fila completa</h4>
          <p className="whitespace-pre-wrap break-all rounded-md border bg-muted p-2 font-mono text-xs">{exampleRow}</p>
          <p className="text-xs text-muted-foreground">Esta fila es solo un ejemplo: no está incluida en la plantilla.</p>
        </section>
      </div>
    </details>
  );
}
