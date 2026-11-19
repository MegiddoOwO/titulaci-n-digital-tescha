import type { Asignacion } from "@/types/tramite";

function Persona({ a }: { a: Asignacion }) {
  return (
    <li className="px-4 py-3">
      <p className="text-sm font-semibold">
        {a.grado_academico ? `${a.grado_academico} ` : ""}
        {a.nombre} {a.apellido_paterno}
      </p>
      <a href={`mailto:${a.email}`} className="break-all text-sm underline underline-offset-2 hover:text-muted-foreground">
        {a.email}
      </a>
    </li>
  );
}

export function AsesoresPanel({ asignaciones, opcion }: { asignaciones: Asignacion[]; opcion: string }) {
  const asesores = asignaciones.filter((a) => a.rol_asignacion === "asesor");
  const sinodales = asignaciones.filter((a) => a.rol_asignacion === "sinodal");

  if (asesores.length === 0 && sinodales.length === 0) {
    return (
      <p className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Aún no tienes asesores asignados. Control Escolar te avisará cuando se asignen.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Docentes asignados a tu trámite de {opcion}. Coordina con tu asesor las fechas de revisión y entrega de avances.
      </p>
      {asesores.length > 0 && (
        <section aria-labelledby="asesores-titulo" className="overflow-hidden rounded-lg border bg-card">
          <h2 id="asesores-titulo" className="border-b px-4 py-3 text-sm font-extrabold">
            {asesores.length === 1 ? "Asesor" : "Asesores"}
          </h2>
          <ul className="divide-y">{asesores.map((a, i) => <Persona key={i} a={a} />)}</ul>
        </section>
      )}
      {sinodales.length > 0 && (
        <section aria-labelledby="sinodales-titulo" className="overflow-hidden rounded-lg border bg-card">
          <h2 id="sinodales-titulo" className="border-b px-4 py-3 text-sm font-extrabold">
            Sinodales
          </h2>
          <ul className="divide-y">{sinodales.map((a, i) => <Persona key={i} a={a} />)}</ul>
        </section>
      )}
    </div>
  );
}
