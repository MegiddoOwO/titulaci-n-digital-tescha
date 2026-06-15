import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { usuarioRepository } from "../../infrastructure/database/MysqlUsuarioRepository";
import type { JwtPayload } from "../../domain/entities/Usuario";

export interface LoginResult {
  success: boolean;
  token?: string;
  usuario?: {
    id: number;
    numero_control: string;
    nombre: string;
    apellido_paterno: string;
    rol: string;
    email: string;
  };
  error?: string;
  bloqueado?: boolean;
}

export async function loginUseCase(
  numero_control: string,
  password: string,
  ip: string
): Promise<LoginResult> {
  const usuario = await usuarioRepository.findByNumeroControl(numero_control);

  if (!usuario) {
    return { success: false, error: "Número de control o contraseña incorrectos." };
  }

  // Verificar si está bloqueado
  const bloqueado = await usuarioRepository.esUsuarioBloqueado(usuario);
  if (bloqueado) {
    return {
      success: false,
      bloqueado: true,
      error: "Cuenta bloqueada por seguridad. Intente de nuevo más tarde.",
    };
  }

  // Verificar contraseña con bcrypt
  const passwordValido = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValido) {
    const intentosActuales = await usuarioRepository.incrementarIntentos(usuario.id);
    if (intentosActuales >= env.LOGIN_MAX_ATTEMPTS) {
      await usuarioRepository.bloquearUsuario(usuario.id, env.LOGIN_BLOCK_MINUTES);
      return {
        success: false,
        bloqueado: true,
        error: `Cuenta bloqueada por seguridad (${env.LOGIN_BLOCK_MINUTES} min). Demasiados intentos fallidos.`,
      };
    }

    const restantes = env.LOGIN_MAX_ATTEMPTS - intentosActuales;
    return {
      success: false,
      error: `Número de control o contraseña incorrectos. Intentos restantes: ${restantes}.`,
    };
  }

  // Login exitoso — resetear intentos y bloqueo
  await usuarioRepository.resetearIntentos(usuario.id);

  // Generar JWT
  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    sub: usuario.id,
    numero_control: usuario.numero_control,
    rol: usuario.rol,
    nombre: `${usuario.nombre} ${usuario.apellido_paterno}`,
  };

  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  return {
    success: true,
    token,
    usuario: {
      id: usuario.id,
      numero_control: usuario.numero_control,
      nombre: usuario.nombre,
      apellido_paterno: usuario.apellido_paterno,
      rol: usuario.rol,
      email: usuario.email,
    },
  };
}
