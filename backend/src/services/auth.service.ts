import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  updateLastAccess,
} from "../repositories/auth.repository.js";
import type { LoginInput } from "../validators/auth.validator.js";
import { createAccessToken } from "../utils/jwt.js";

export class AuthenticationError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export interface LoginResult {
  token: string;
  usuario: {
    id_usuario: number;
    nombres: string;
    apellidos: string;
    correo: string;
    id_rol: number;
    rol: string;
  };
}

export async function login(
  input: LoginInput,
): Promise<LoginResult> {
  const user = await findUserByEmail(input.correo);

  if (!user) {
    throw new AuthenticationError(
      401,
      "Correo o contraseña incorrectos",
    );
  }

  const validPassword = await bcrypt.compare(
    input.password,
    user.password_hash,
  );

  if (!validPassword) {
    throw new AuthenticationError(
      401,
      "Correo o contraseña incorrectos",
    );
  }

  if (user.estado !== "ACTIVO") {
    throw new AuthenticationError(
      403,
      "La cuenta de usuario se encuentra inactiva",
    );
  }

  if (user.estado_rol !== "ACTIVO") {
    throw new AuthenticationError(
      403,
      "El rol asignado se encuentra inactivo",
    );
  }

  const token = await createAccessToken({
    idUsuario: user.id_usuario,
    idRol: user.id_rol,
    rol: user.rol,
    correo: user.correo,
  });

  await updateLastAccess(user.id_usuario);

  return {
    token,
    usuario: {
      id_usuario: user.id_usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      correo: user.correo,
      id_rol: user.id_rol,
      rol: user.rol,
    },
  };
}