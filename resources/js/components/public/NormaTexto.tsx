import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Inline `**bold**` only; the normativa text uses nothing else inline. */
function inline(text: string): ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

const normalize = (s: string) => s.trim().toLowerCase();
const cells = (row: string) =>
  row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

interface Props {
  contenido: string;
  /** A leading `## ` line that only repeats one of these is dropped (the page already shows it). */
  repeatedHeadings: Array<string | null>;
}

/**
 * Renders the small Markdown subset the normativa content uses (## / ### headings, ordered and
 * bullet lists, pipe tables, bold) as real elements, set for reading at about 65ch.
 */
export function NormaTexto({ contenido, repeatedHeadings }: Props) {
  const lines = contenido.split("\n");
  const blocks: ReactNode[] = [];
  const skip = repeatedHeadings.filter(Boolean).map((h) => normalize(h as string));
  let i = 0;
  let key = 0;
  let first = true;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    if (/^#{2,3}\s/.test(line)) {
      const level = line.startsWith("###") ? 4 : 3;
      const text = line.replace(/^#{2,3}\s+/, "");
      i++;
      if (first && level === 3 && skip.includes(normalize(text))) continue;
      first = false;
      blocks.push(
        level === 3 ? (
          <h3 key={key++} className="mt-8 text-lg font-bold">
            {text}
          </h3>
        ) : (
          <h4 key={key++} className="mt-6 text-base font-bold">
            {text}
          </h4>
        ),
      );
      continue;
    }
    first = false;

    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const row = lines[i].trim();
        if (!/^\|[\s:|-]+\|?$/.test(row)) rows.push(cells(row));
        i++;
      }
      const [head, ...body] = rows;
      if (!head) continue;
      blocks.push(
        <div
          key={key++}
          role="region"
          tabIndex={0}
          aria-label={`Tabla: ${head.join(", ")}`}
          className="mt-5 overflow-x-auto rounded-lg border border-border"
        >
          <table className={cn("w-full border-collapse text-left text-sm", head.length > 3 && "min-w-[32rem]")}>
            <thead>
              <tr className="border-b border-border bg-muted">
                {head.map((c, ci) => (
                  <th key={ci} scope="col" className="px-3 py-2.5 font-semibold text-foreground">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="border-b border-border last:border-0">
                  {r.map((c, ci) => (
                    <td key={ci} className="px-3 py-2.5 align-top">
                      {inline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const ordered = /^\d+\.\s/.test(line);
    if (ordered || /^-\s/.test(line)) {
      const re = ordered ? /^\d+\.\s+/ : /^-\s+/;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(re, ""));
        i++;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={key++} className={`mt-4 space-y-2 pl-6 marker:text-muted-foreground ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((t, ti) => (
            <li key={ti} className="pl-1">
              {inline(t)}
            </li>
          ))}
        </List>,
      );
      continue;
    }

    blocks.push(
      <p key={key++} className="mt-4">
        {inline(line)}
      </p>,
    );
    i++;
  }

  return <div className="max-w-[65ch] text-base leading-7 text-foreground/90 [&>:first-child]:mt-0">{blocks}</div>;
}
