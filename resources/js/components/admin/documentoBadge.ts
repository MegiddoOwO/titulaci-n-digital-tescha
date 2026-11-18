export const documentoBadgeClass = (estatus: string) =>
  estatus === "aprobado" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" :
  estatus === "rechazado" ? "bg-rose-100 text-rose-700 hover:bg-rose-200" :
  estatus === "cargado" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" :
  estatus === "en_revision" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" :
  "bg-gray-100 text-gray-600 hover:bg-gray-200";

export const documentoBadgeLabel = (estatus: string) =>
  estatus === "cargado" ? "Recibido" : estatus === "en_revision" ? "En Revisión" : estatus;
