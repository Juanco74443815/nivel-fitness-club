import { findActivePlanById, findPlanById } from "../repositories/plan-membresia.repository.js";
import { findSocioByUsuarioId } from "../repositories/reserva.repository.js";
import { findSocioById } from "../repositories/socio.repository.js";
import {
  cambiarEstadoMembresiaById,
  createMembresia as insertMembresia,
  findAllMembresias,
  findMembresiaById,
  type MembresiaRecord,
  renovarMembresiaById,
} from "../repositories/membresia.repository.js";
import type {
  CambiarEstadoMembresiaInput,
  CreateMembresiaInput,
} from "../validators/membresia.validator.js";

export class MembresiaError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "MembresiaError";
  }
}

const UNIQUE_VIOLATION = "23505";

// `pg` devuelve las columnas DATE como objetos Date (no como string, pese a
// lo que indiquen los tipos de los *Record), así que esta función acepta
// ambos para poder sumar días sobre un valor recién validado o uno leído
// de la base de datos.
function sumarDias(fecha: string | Date, dias: number): string {
  const base = fecha instanceof Date ? fecha : new Date(`${fecha}T00:00:00Z`);
  const resultado = new Date(base.getTime());
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function registerMembresia(
  input: CreateMembresiaInput,
): Promise<MembresiaRecord> {
  const socio = await findSocioById(input.id_socio);

  if (!socio) {
    throw new MembresiaError(400, "El socio seleccionado no existe");
  }

  if (socio.estado !== "ACTIVO") {
    throw new MembresiaError(400, "El socio seleccionado se encuentra inactivo");
  }

  const plan = await findActivePlanById(input.id_plan);

  if (!plan) {
    throw new MembresiaError(
      400,
      "El plan seleccionado no existe o se encuentra inactivo",
    );
  }

  const fechaFin = sumarDias(input.fecha_inicio, plan.duracion_dias);
  const estado = input.fecha_inicio <= hoyIso() ? "ACTIVA" : "PENDIENTE";

  try {
    return await insertMembresia({
      idSocio: input.id_socio,
      idPlan: input.id_plan,
      fechaInicio: input.fecha_inicio,
      fechaFin,
      estado,
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === UNIQUE_VIOLATION
    ) {
      throw new MembresiaError(
        409,
        "El socio ya tiene una membresía vigente (pendiente o activa)",
      );
    }

    throw error;
  }
}

export async function listMembresias(
  idUsuarioAutenticado: number,
  actorRole: string,
): Promise<MembresiaRecord[]> {
  if (actorRole === "Socio") {
    const socio = await findSocioByUsuarioId(idUsuarioAutenticado);

    if (!socio) {
      throw new MembresiaError(
        403,
        "La cuenta autenticada no está vinculada a ningún socio",
      );
    }

    return findAllMembresias({
      idSocio: socio.id_socio,
      estados: ["PENDIENTE", "ACTIVA"],
    });
  }

  return findAllMembresias({});
}

export async function renovarMembresia(
  idMembresia: number,
): Promise<MembresiaRecord> {
  const membresia = await findMembresiaById(idMembresia);

  if (!membresia) {
    throw new MembresiaError(404, "La membresía seleccionada no existe");
  }

  if (membresia.estado === "ANULADA") {
    throw new MembresiaError(409, "No se puede renovar una membresía anulada");
  }

  const plan = await findPlanById(membresia.id_plan);

  if (!plan) {
    throw new MembresiaError(400, "El plan asociado a la membresía no existe");
  }

  const fechaFin = sumarDias(membresia.fecha_fin, plan.duracion_dias);

  return renovarMembresiaById({
    idMembresia,
    fechaFin,
    estado: "ACTIVA",
  });
}

export async function cambiarEstadoMembresia(
  idMembresia: number,
  input: CambiarEstadoMembresiaInput,
): Promise<MembresiaRecord> {
  const membresia = await findMembresiaById(idMembresia);

  if (!membresia) {
    throw new MembresiaError(404, "La membresía seleccionada no existe");
  }

  return cambiarEstadoMembresiaById({
    idMembresia,
    estado: input.estado,
    motivoAnulacion: input.estado === "ANULADA" ? input.motivo_anulacion ?? null : null,
  });
}
