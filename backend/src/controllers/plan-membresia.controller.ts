import type { Request, Response } from "express";
import {
  deactivatePlan,
  getPlanById,
  listPlanes,
  PlanMembresiaError,
  registerPlan,
  updatePlan,
} from "../services/plan-membresia.service.js";
import {
  createPlanMembresiaSchema,
  updatePlanMembresiaSchema,
} from "../validators/plan-membresia.validator.js";

export async function createPlanController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = createPlanMembresiaSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const plan = await registerPlan(validation.data);

    response.status(201).json({
      status: "ok",
      message: "Plan de membresía registrado correctamente",
      data: plan,
    });
  } catch (error) {
    console.error("Error al registrar plan de membresía:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo registrar el plan de membresía",
    });
  }
}

export async function listPlanesController(
  request: Request,
  response: Response,
): Promise<void> {
  const estadoParam =
    typeof request.query.estado === "string"
      ? request.query.estado.toUpperCase()
      : undefined;

  if (
    estadoParam !== undefined &&
    estadoParam !== "ACTIVO" &&
    estadoParam !== "INACTIVO"
  ) {
    response.status(400).json({
      status: "error",
      message: "El filtro de estado no es válido",
    });

    return;
  }

  if (!request.auth) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  try {
    const planes = await listPlanes({ estado: estadoParam }, request.auth.rol);

    response.status(200).json({
      status: "ok",
      message: "Planes de membresía consultados correctamente",
      data: planes,
    });
  } catch (error) {
    console.error("Error al listar planes de membresía:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudieron consultar los planes de membresía",
    });
  }
}

export async function getPlanController(
  request: Request,
  response: Response,
): Promise<void> {
  const idPlan = Number(request.params.id);

  if (!Number.isInteger(idPlan) || idPlan <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del plan no es válido",
    });

    return;
  }

  try {
    const plan = await getPlanById(idPlan);

    response.status(200).json({
      status: "ok",
      message: "Plan de membresía consultado correctamente",
      data: plan,
    });
  } catch (error) {
    if (error instanceof PlanMembresiaError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al consultar plan de membresía:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo consultar el plan de membresía",
    });
  }
}

export async function updatePlanController(
  request: Request,
  response: Response,
): Promise<void> {
  const idPlan = Number(request.params.id);

  if (!Number.isInteger(idPlan) || idPlan <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del plan no es válido",
    });

    return;
  }

  const validation = updatePlanMembresiaSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const plan = await updatePlan(idPlan, validation.data);

    response.status(200).json({
      status: "ok",
      message: "Plan de membresía actualizado correctamente",
      data: plan,
    });
  } catch (error) {
    if (error instanceof PlanMembresiaError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al actualizar plan de membresía:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo actualizar el plan de membresía",
    });
  }
}

export async function deactivatePlanController(
  request: Request,
  response: Response,
): Promise<void> {
  const idPlan = Number(request.params.id);

  if (!Number.isInteger(idPlan) || idPlan <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del plan no es válido",
    });

    return;
  }

  try {
    const plan = await deactivatePlan(idPlan);

    response.status(200).json({
      status: "ok",
      message: "Plan de membresía desactivado correctamente",
      data: plan,
    });
  } catch (error) {
    if (error instanceof PlanMembresiaError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al desactivar plan de membresía:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo desactivar el plan de membresía",
    });
  }
}
