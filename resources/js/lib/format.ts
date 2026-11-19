/** Progress percentage of a trámite, shown everywhere as a whole number: 28.6 becomes "29%". */
export function formatPercent(value: number | string | null | undefined): string {
  return `${Math.round(Number(value) || 0)}%`;
}
