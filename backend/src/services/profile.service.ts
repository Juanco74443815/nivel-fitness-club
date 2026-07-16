import { findUserProfileById } from "../repositories/profile.repository.js";

export class ProfileError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ProfileError";
  }
}

export interface ProfileResult {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  ci: string | null;
  telefono: string | null;
  correo: string;
  estado: string;
  fecha_creacion: Date;
  ultimo_acceso: Date | null;
  id_rol: number;
  rol: string;
}

export async function getProfile(
  idUsuario: number,
): Promise<ProfileResult> {
  const user = await findUserProfileById(idUsuario);

  if (!user) {
    throw new ProfileError(
      401,
      "La sesión ya no es válida",
    );
  }

  if (user.estado !== "ACTIVO") {
    throw new ProfileError(
      403,
      "La cuenta de usuario se encuentra inactiva",
    );
  }

  if (user.estado_rol !== "ACTIVO") {
    throw new ProfileError(
      403,
      "El rol asignado se encuentra inactivo",
    );
  }

  return {
    id_usuario: user.id_usuario,
    nombres: user.nombres,
    apellidos: user.apellidos,
    ci: user.ci,
    telefono: user.telefono,
    correo: user.correo,
    estado: user.estado,
    fecha_creacion: user.fecha_creacion,
    ultimo_acceso: user.ultimo_acceso,
    id_rol: user.id_rol,
    rol: user.rol,
  };
}