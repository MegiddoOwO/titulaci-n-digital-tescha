import path from "path";
import fs from "fs";
import { documentoRepository, tramiteRepository } from "../../infrastructure/database/MysqlTramiteRepository";
import { query } from "../../config/database";

const ALLOWED_MIMES: Record<string, string[]> = {
  PDF: ["application/pdf"],
  JPEG: ["image/jpeg"],
  JPG: ["image/jpeg"],
  PNG: ["image/png"],
};

const UPLOAD_DIR = path.resolve(__dirname, "../../../uploads");

export async function subirDocumentoUseCase(
  tramite_id: number,
  tipo_documento_id: number,
  usuario_id: number,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer }
): Promise<{ success: boolean; documentoId?: number; error?: string }> {
  // Validar que el trámite pertenezca al usuario
  const tramite = await tramiteRepository.findById(tramite_id);
  if (!tramite) {
    return { success: false, error: "Trámite no encontrado." };
  }
  if (tramite.usuario_id !== usuario_id) {
    return { success: false, error: "No tiene permiso para subir documentos a este trámite." };
  }

  // Obtener info del tipo de documento
  const tipos = await query<{ nombre: string; formato_permitido: string; tamaño_max_mb: string }[]>(
    "SELECT nombre, formato_permitido, tamaño_max_mb FROM tipos_documento WHERE id = ? AND activo = 1",
    [tipo_documento_id]
  );
  if (tipos.length === 0) {
    return { success: false, error: "Tipo de documento no válido." };
  }
  const tipo = tipos[0];

  // Validar prerrequisito (P-17)
  const prereq = await documentoRepository.verificarPrerrequisito(tramite_id, tipo_documento_id);
  if (prereq.bloqueado) {
    return { success: false, error: prereq.mensaje || "Documento bloqueado por prerrequisito." };
  }

  // Validar formato (P-12)
  const formatosPermitidos = tipo.formato_permitido.split(",").map((f) => f.trim().toUpperCase());
  let allowedMimes: string[] = [];
  for (const fmt of formatosPermitidos) {
    if (ALLOWED_MIMES[fmt]) {
      allowedMimes.push(...ALLOWED_MIMES[fmt]);
    }
  }

  if (allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
    return {
      success: false,
      error: `Formato no permitido. Solo se aceptan: ${tipo.formato_permitido}.`,
    };
  }

  // Validar tamaño (P-13)
  const tamañoMax = parseFloat(tipo.tamaño_max_mb) * 1024 * 1024;
  if (file.size > tamañoMax) {
    return {
      success: false,
      error: `El archivo excede el límite de ${tipo.tamaño_max_mb} MB. Tamaño actual: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
    };
  }

  // Validar PDF no corrupto (P-11) - verificar header %PDF
  if (file.mimetype === "application/pdf") {
    const header = file.buffer.slice(0, 5).toString();
    if (!header.startsWith("%PDF")) {
      return {
        success: false,
        error: "El archivo parece estar corrupto o no es un PDF válido. Verifique el documento e intente de nuevo.",
      };
    }
  }

  // Guardar archivo
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const filename = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, file.buffer);

  // Registrar en BD
  const docId = await documentoRepository.uploadDocumento(
    tramite_id,
    tipo_documento_id,
    filename,
    file.originalname,
    file.size
  );

  // Registrar en historial
  await documentoRepository.addHistorial(
    tramite_id,
    docId,
    null,
    "cargado",
    `Documento "${tipo.nombre}" subido: ${file.originalname} (${(file.size / 1024).toFixed(0)} KB)`,
    usuario_id
  );

  return { success: true, documentoId: docId };
}
