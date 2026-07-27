import {
  createPlan,
  deactivatePlanById,
  findAllPlanes,
  findPlanById,
  type PlanMembresiaRecord,
  updatePlanById,
} from "../repositories/plan-membresia.repository.js";
import type {
  CreatePlanMembresiaInput,
  UpdatePlanMembresiaInput,
} from "../validators/plan-membresia.validator.js";

export class PlanMembresiaError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "PlanMembresiaError";
  }
}

export async function registerPlan(
  input: CreatePlanMembresiaInput,
): Promise<PlanMembresiaRecord> {
  return createPlan({
    nombre: input.nombre,
    descripcion: input.descripcion?.trim() || null,
    duracionDias: input.duracion_dias,
    precio: input.precio,
  });
}

export async function listPlanes(
  filters: { estado?: string },
  actorRole: string,
): Promise<PlanMembresiaRecord[]> {
  // Un Socio nunca debe ver planes desactivados (HDU-24); el Administrador
  // puede verlos todos para fines de mantenimiento (HDU-24, observación).
  const estado = actorRole === "Administrador" ? filters.estado : "ACTIVO";

  return findAllPlanes({ estado });
}

export async function getPlanById(
  idPlan: number,
): Promise<PlanMembresiaRecord> {
  const plan = await findPlanById(idPlan);

  if (!plan) {
    throw new PlanMembresiaError(404, "El plan de membresía seleccionado no existe");
  }

  return plan;
}

export async function updatePlan(
  idPlan: number,
  input: UpdatePlanMembresiaInput,
): Promise<PlanMembresiaRecord> {
  const current = await findPlanById(idPlan);

  if (!current) {
    throw new PlanMembresiaError(404, "El plan de membresía seleccionado no existe");
  }

  const nombre = input.nombre ?? current.nombre;
  const descripcion =
    input.descripcion === undefined
      ? current.descripcion
      : input.descripcion?.trim() || null;
  const duracionDias = input.duracion_dias ?? current.duracion_dias;
  const precio = input.precio ?? Number(current.precio);

  return updatePlanById({ idPlan, nombre, descripcion, duracionDias, precio });
}

export async function deactivatePlan(
  idPlan: number,
): Promise<PlanMembresiaRecord> {
  const current = await findPlanById(idPlan);

  if (!current) {
    throw new PlanMembresiaError(404, "El plan de membresía seleccionado no existe");
  }

  if (current.estado === "INACTIVO") {
    throw new PlanMembresiaError(409, "El plan ya se encuentra inactivo");
  }

  return deactivatePlanById(idPlan);
}
