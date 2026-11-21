/** Browser-side CSV helpers for the bulk invitations dialog (nothing here touches storage or the network). */

/** Quote a cell and neutralise spreadsheet formulas: a leading = + - @ tab or CR gets an apostrophe. */
export function csvCell(value: string | number | null | undefined): string {
    let text = value === null || value === undefined ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

    return /[",\r\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** UTF-8 text with BOM (so Excel reads accents) and CRLF line breaks. */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
    const lines = [header, ...rows].map((r) => r.map(csvCell).join(','));

    return `﻿${lines.join('\r\n')}\r\n`;
}

export function downloadText(filename: string, text: string): void {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
