import {
  createClase,
  deactivateClaseById,
  findAllClases,
  findClaseById,
  updateClaseById,
  type ClaseRecord,
} from "../repositories/clase.repository.js";
import type {
  CreateClaseInput,
  UpdateClaseInput,
} from "../validators/clase.validator.js";

export class ClaseError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ClaseError";
  }
}

export async function registerClase(
  input: CreateClaseInput,
): Promise<ClaseRecord> {
  return createClase({
    nombre: input.nombre,
    descripcion: input.descripcion?.trim() || null,
    instructor: input.instructor?.trim() || null,
  });
}

export async function listClases(
  filters: { estado?: string; busqueda?: string },
  actorRole: string,
): Promise<ClaseRecord[]> {
  // Un Socio nunca debe ver clases desactivadas, sin importar el filtro enviado.
  const estado = actorRole === "Socio" ? "ACTIVO" : filters.estado;

  return findAllClases({ estado, busqueda: filters.busqueda });
}

export async function getClaseById(idClase: number): Promise<ClaseRecord> {
  const clase = await findClaseById(idClase);

  if (!clase) {
    throw new ClaseError(404, "La clase seleccionada no existe");
  }

  return clase;
}

export async function updateClase(
  idClase: number,
  input: UpdateClaseInput,
): Promise<ClaseRecord> {
  const currentClase = await findClaseById(idClase);

  if (!currentClase) {
    throw new ClaseError(404, "La clase seleccionada no existe");
  }

  const nombre = input.nombre ?? currentClase.nombre;
  const descripcion =
    input.descripcion === undefined
      ? currentClase.descripcion
      : input.descripcion?.trim() || null;
  const instructor =
    input.instructor === undefined
      ? currentClase.instructor
      : input.instructor?.trim() || null;

  return updateClaseById({ idClase, nombre, descripcion, instructor });
}

export async function deactivateClase(
  idClase: number,
): Promise<ClaseRecord> {
  const currentClase = await findClaseById(idClase);

  if (!currentClase) {
    throw new ClaseError(404, "La clase seleccionada no existe");
  }

  if (currentClase.estado === "INACTIVO") {
    throw new ClaseError(409, "La clase ya se encuentra inactiva");
  }

  return deactivateClaseById(idClase);
}
