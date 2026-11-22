/** Progress percentage of a trámite, shown everywhere as a whole number: 28.6 becomes "29%". */
export function formatPercent(value: number | string | null | undefined): string {
  return `${Math.round(Number(value) || 0)}%`;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Date as dd/mm/aaaa with zero padding, in the browser's local time. Invalid input renders as an empty string. */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Date (dd/mm/aaaa) followed by the es-MX time of day, e.g. "21/11/2026, 6:47:12 p.m.". */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  const date = formatDate(value);
  if (!date) return "";
  return `${date}, ${new Date(value as string | number | Date).toLocaleTimeString("es-MX")}`;
}

/** Display-only: "JPEG,PNG" becomes "JPEG, PNG". */
export function formatList(value: string | null | undefined): string {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}
