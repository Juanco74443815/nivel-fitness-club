import {
  cancelProgramacionById,
  createProgramacion,
  findActiveClaseById,
  findAllProgramaciones,
  findProgramacionById,
  updateProgramacionById,
  type ProgramacionRecord,
} from "../repositories/programacion.repository.js";
import type {
  CreateProgramacionInput,
  UpdateProgramacionInput,
} from "../validators/programacion.validator.js";

export class ProgramacionError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ProgramacionError";
  }
}

function assertHorarioValido(horaInicio: string, horaFin: string): void {
  if (horaFin <= horaInicio) {
    throw new ProgramacionError(
      400,
      "La hora de fin debe ser posterior a la hora de inicio",
    );
  }
}

export async function registerProgramacion(
  input: CreateProgramacionInput,
): Promise<ProgramacionRecord> {
  const clase = await findActiveClaseById(input.id_clase);

  if (!clase) {
    throw new ProgramacionError(
      400,
      "La clase seleccionada no existe o se encuentra inactiva",
    );
  }

  assertHorarioValido(input.hora_inicio, input.hora_fin);

  return createProgramacion({
    idClase: input.id_clase,
    fecha: input.fecha,
    horaInicio: input.hora_inicio,
    horaFin: input.hora_fin,
    cupoMaximo: input.cupo_maximo,
  });
}

export async function listProgramaciones(
  filters: { estado?: string; idClase?: number },
  actorRole: string,
): Promise<ProgramacionRecord[]> {
  // Recepcionista y Socio solo consultan disponibilidad (HDU-19): únicamente
  // sesiones con estado PROGRAMADA. El Administrador puede ver todas para
  // gestionarlas (HDU-18), salvo que envíe explícitamente un filtro de estado.
  const estado =
    actorRole === "Administrador" ? filters.estado : "PROGRAMADA";

  return findAllProgramaciones({ estado, idClase: filters.idClase });
}

export async function getProgramacionById(
  idProgramacion: number,
): Promise<ProgramacionRecord> {
  const programacion = await findProgramacionById(idProgramacion);

  if (!programacion) {
    throw new ProgramacionError(
      404,
      "La programación seleccionada no existe",
    );
  }

  return programacion;
}

export async function updateProgramacion(
  idProgramacion: number,
  input: UpdateProgramacionInput,
): Promise<ProgramacionRecord> {
  const current = await findProgramacionById(idProgramacion);

  if (!current) {
    throw new ProgramacionError(
      404,
      "La programación seleccionada no existe",
    );
  }

  if (current.estado !== "PROGRAMADA") {
    throw new ProgramacionError(
      409,
      "Solo se puede modificar una sesión con estado PROGRAMADA",
    );
  }

  const fecha = input.fecha ?? current.fecha;
  const horaInicio = input.hora_inicio ?? current.hora_inicio;
  const horaFin = input.hora_fin ?? current.hora_fin;
  const cupoMaximo = input.cupo_maximo ?? current.cupo_maximo;

  assertHorarioValido(horaInicio, horaFin);

  return updateProgramacionById({
    idProgramacion,
    fecha,
    horaInicio,
    horaFin,
    cupoMaximo,
  });
}

export async function cancelProgramacion(
  idProgramacion: number,
): Promise<ProgramacionRecord> {
  const current = await findProgramacionById(idProgramacion);

  if (!current) {
    throw new ProgramacionError(
      404,
      "La programación seleccionada no existe",
    );
  }

  if (current.estado === "CANCELADA") {
    throw new ProgramacionError(
      409,
      "La sesión ya se encuentra cancelada",
    );
  }

  if (current.estado === "FINALIZADA") {
    throw new ProgramacionError(
      409,
      "No se puede cancelar una sesión ya finalizada",
    );
  }

  return cancelProgramacionById(idProgramacion);
}
