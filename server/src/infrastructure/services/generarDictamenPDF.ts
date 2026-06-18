import PDFDocument from "pdfkit";
import { Response } from "express";

interface DictamenPDFData {
  estudiante: string;
  numero_control: string;
  opcion: string;
  fecha_emision: string;
  resultado: string;
  observaciones: string | null;
  emitido_nombre: string;
}

const GUINDA = "#8A2036";
const GUINDA_OSCURO = "#56212F";
const DORADO = "#BC955B";
const MW = 50; // margin width

export function generarDictamenPDF(res: Response, d: DictamenPDFData): void {
  const doc = new PDFDocument({ size: "LETTER", margin: MW });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=dictamen_${d.numero_control}.pdf`);
  doc.pipe(res);

  // ── Cabecera ──
  const headerH = 130;
  doc.rect(0, 0, 612, headerH).fill(GUINDA);

  // Escudo representado con texto (pdfkit no soporta SVG)
  doc.font("Helvetica-Bold").fontSize(28).fill(DORADO);
  doc.text("TESCHA", MW, 15, { align: "center", width: 512 });

  doc.font("Helvetica-Bold").fontSize(15).fill("#FFFFFF");
  doc.text("TECNOLÓGICO DE ESTUDIOS SUPERIORES DE CHALCO", MW, 62, { align: "center", width: 512 });
  doc.font("Helvetica").fontSize(10).fill(DORADO);
  doc.text("INGENIERÍA EN SISTEMAS COMPUTACIONALES", MW, 82, { align: "center", width: 512 });

  // Línea divisoria
  doc.moveTo(MW, headerH).lineTo(612 - MW, headerH).lineWidth(2).stroke(GUINDA_OSCURO);

  // ── Título ──
  doc.font("Helvetica-Bold").fontSize(16).fill(GUINDA_OSCURO);
  doc.text("DICTAMEN DE TITULACIÓN", MW, headerH + 35, { align: "center", width: 512 });

  // ── Datos ──
  const dataY = headerH + 80;
  const lineStart = 200;
  const lineEnd = 612 - MW;
  const rowH = 28;

  const campos: { label: string; value: string }[] = [
    { label: "Alumno:", value: d.estudiante },
    { label: "Número de Control:", value: d.numero_control },
    { label: "Opción de Titulación:", value: d.opcion },
    { label: "Fecha de Emisión:", value: new Date(d.fecha_emision).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) },
  ];

  campos.forEach((c, i) => {
    const y = dataY + i * rowH;
    doc.font("Helvetica").fontSize(11).fill("#333");
    doc.text(c.label, MW, y, { continued: true }).text(c.value, lineStart, y + 2);
    doc.moveTo(lineStart, y + 16).lineTo(lineEnd, y + 16).lineWidth(0.5).stroke("#CCC");
  });

  // ── Recuadro de Resultado ──
  const resultY = dataY + campos.length * rowH + 20;
  const resultH = 45;
  const esAprobado = d.resultado === "aprobado";

  doc.rect(MW, resultY, lineEnd - MW, resultH).lineWidth(1.5).stroke(GUINDA_OSCURO);
  doc.rect(MW, resultY, lineEnd - MW, resultH).fill(esAprobado ? "#ECFDF5" : "#FFF1F2");

  doc.font("Helvetica-Bold").fontSize(13).fill("#333");
  doc.text("RESULTADO:", MW + 10, resultY + 12, { continued: true });
  doc.fill(esAprobado ? "#065F46" : "#9B1C1C");
  doc.text(esAprobado ? "APROBADO" : "RECHAZADO", MW + 20, resultY + 12);

  // ── Observaciones ──
  const obsY = resultY + resultH + 30;
  doc.font("Helvetica-Bold").fontSize(11).fill("#333");
  doc.text("Observaciones:", MW, obsY);

  // 5 líneas guía
  for (let i = 0; i < 5; i++) {
    const ly = obsY + 18 + i * 16;
    doc.moveTo(MW, ly).lineTo(lineEnd, ly).lineWidth(0.5).stroke("#CCC");
  }

  // Texto real de observaciones si existe
  if (d.observaciones) {
    doc.font("Helvetica").fontSize(10).fill("#555");
    doc.text(d.observaciones, MW, obsY + 18, { width: lineEnd - MW, height: 70, ellipsis: true });
  }

  // ── Firma ──
  const firmaX = 330;
  const firmaY = obsY + 130;
  doc.moveTo(firmaX, firmaY).lineTo(lineEnd, firmaY).lineWidth(0.5).stroke("#333");
  doc.font("Helvetica").fontSize(9).fill("#555");
  doc.text("Firma del Administrativo", firmaX, firmaY + 5, { align: "center", width: lineEnd - firmaX });

  // ── Footer ──
  doc.font("Helvetica").fontSize(7).fill(GUINDA_OSCURO);
  doc.text("Tecnológico de Estudios Superiores de Chalco  —  SCA-TESCHA  —  Sistema de Titulación ISC",
    MW, 740, { align: "center", width: 512 });

  doc.end();
}
