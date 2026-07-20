import {
  createSocio,
  deactivateSocioById,
  findAllSocios,
  findSocioByCiExcludingId,
  findSocioByCiForValidation,
  findSocioByCorreoExcludingId,
  findSocioByCorreoForValidation,
  findSocioById,
  findSocioByUsuarioId,
  findUserByIdForLink,
  updateSocioById,
  type SocioRecord,
} from "../repositories/socio.repository.js";
import type {
  CreateSocioInput,
  UpdateSocioInput,
} from "../validators/socio.validator.js";

export class SocioError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "SocioError";
  }
}

export async function registerSocio(
  input: CreateSocioInput,
): Promise<SocioRecord> {
  const ci = input.ci?.trim() || null;
  const correo = input.correo?.trim().toLowerCase() || null;
  const telefono = input.telefono?.trim() || null;
  const fechaNacimiento = input.fecha_nacimiento ?? null;
  const idUsuario = input.id_usuario ?? null;

  if (ci) {
    const existingCi = await findSocioByCiForValidation(ci);

    if (existingCi) {
      throw new SocioError(
        409,
        "Ya existe un socio registrado con ese CI",
      );
    }
  }

  if (correo) {
    const existingCorreo = await findSocioByCorreoForValidation(correo);

    if (existingCorreo) {
      throw new SocioError(
        409,
        "Ya existe un socio registrado con ese correo",
      );
    }
  }

  if (idUsuario) {
    const user = await findUserByIdForLink(idUsuario);

    if (!user) {
      throw new SocioError(
        400,
        "El usuario indicado para vincular no existe",
      );
    }

    const existingLink = await findSocioByUsuarioId(idUsuario);

    if (existingLink) {
      throw new SocioError(
        409,
        "Ese usuario ya está vinculado a otro socio",
      );
    }
  }

  return createSocio({
    idUsuario,
    nombres: input.nombres,
    apellidos: input.apellidos,
    ci,
    telefono,
    correo,
    fechaNacimiento,
  });
}

export async function listSocios(filters: {
  estado?: string;
  busqueda?: string;
}): Promise<SocioRecord[]> {
  return findAllSocios(filters);
}

export async function getSocioById(
  idSocio: number,
): Promise<SocioRecord> {
  const socio = await findSocioById(idSocio);

  if (!socio) {
    throw new SocioError(404, "El socio seleccionado no existe");
  }

  return socio;
}

export async function updateSocio(
  idSocio: number,
  input: UpdateSocioInput,
): Promise<SocioRecord> {
  const currentSocio = await findSocioById(idSocio);

  if (!currentSocio) {
    throw new SocioError(404, "El socio seleccionado no existe");
  }

  const nombres = input.nombres ?? currentSocio.nombres;
  const apellidos = input.apellidos ?? currentSocio.apellidos;
  const ci =
    input.ci === undefined ? currentSocio.ci : input.ci?.trim() || null;
  const telefono =
    input.telefono === undefined
      ? currentSocio.telefono
      : input.telefono?.trim() || null;
  const correo =
    input.correo === undefined
      ? currentSocio.correo
      : input.correo?.trim().toLowerCase() || null;
  const fechaNacimiento =
    input.fecha_nacimiento === undefined
      ? currentSocio.fecha_nacimiento
      : input.fecha_nacimiento;

  if (ci) {
    const existingCi = await findSocioByCiExcludingId(ci, idSocio);

    if (existingCi) {
      throw new SocioError(
        409,
        "Ya existe otro socio registrado con ese CI",
      );
    }
  }

  if (correo) {
    const existingCorreo = await findSocioByCorreoExcludingId(
      correo,
      idSocio,
    );

    if (existingCorreo) {
      throw new SocioError(
        409,
        "Ya existe otro socio registrado con ese correo",
      );
    }
  }

  return updateSocioById({
    idSocio,
    nombres,
    apellidos,
    ci,
    telefono,
    correo,
    fechaNacimiento,
  });
}

export async function deactivateSocio(
  idSocio: number,
): Promise<SocioRecord> {
  const currentSocio = await findSocioById(idSocio);

  if (!currentSocio) {
    throw new SocioError(404, "El socio seleccionado no existe");
  }

  if (currentSocio.estado === "INACTIVO") {
    throw new SocioError(
      409,
      "El socio ya se encuentra inactivo",
    );
  }

  return deactivateSocioById(idSocio);
}
