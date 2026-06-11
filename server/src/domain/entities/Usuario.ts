export interface Usuario {
  id: number;
  numero_control: string;
  email: string;
  password_hash: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  rol: "estudiante" | "asesor" | "administrativo";
  activo: number;
  intentos_fallidos: number;
  bloqueado_hasta: Date | null;
  grado_academico: string | null;
  carga_maxima: number | null;
  programa_academico: string | null;
  created_at: Date;
  updated_at: Date;
}

export type RolUsuario = Usuario["rol"];

export interface JwtPayload {
  sub: number;
  numero_control: string;
  rol: RolUsuario;
  nombre: string;
}
