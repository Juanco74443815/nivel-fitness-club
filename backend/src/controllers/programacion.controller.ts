import type { Request, Response } from "express";
import {
  cancelProgramacion,
  getProgramacionById,
  listProgramaciones,
  ProgramacionError,
  registerProgramacion,
  updateProgramacion,
} from "../services/programacion.service.js";
import {
  createProgramacionSchema,
  updateProgramacionSchema,
} from "../validators/programacion.validator.js";

export async function createProgramacionController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = createProgramacionSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const programacion = await registerProgramacion(validation.data);

    response.status(201).json({
      status: "ok",
      message: "Programación registrada correctamente",
      data: programacion,
    });
  } catch (error) {
    if (error instanceof ProgramacionError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al registrar programación:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo registrar la programación",
    });
  }
}

export async function listProgramacionesController(
  request: Request,
  response: Response,
): Promise<void> {
  const estadoParam =
    typeof request.query.estado === "string"
      ? request.query.estado.toUpperCase()
      : undefined;

  const estadosValidos = ["PROGRAMADA", "CANCELADA", "FINALIZADA"];

  if (estadoParam !== undefined && !estadosValidos.includes(estadoParam)) {
    response.status(400).json({
      status: "error",
      message: "El filtro de estado no es válido",
    });

    return;
  }

  const idClaseParam =
    typeof request.query.id_clase === "string" &&
    Number.isInteger(Number(request.query.id_clase))
      ? Number(request.query.id_clase)
      : undefined;

  if (!request.auth) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  try {
    const programaciones = await listProgramaciones(
      { estado: estadoParam, idClase: idClaseParam },
      request.auth.rol,
    );

    response.status(200).json({
      status: "ok",
      message: "Programaciones consultadas correctamente",
      data: programaciones,
    });
  } catch (error) {
    console.error("Error al listar programaciones:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudieron consultar las programaciones",
    });
  }
}

export async function getProgramacionController(
  request: Request,
  response: Response,
): Promise<void> {
  const idProgramacion = Number(request.params.id);

  if (!Number.isInteger(idProgramacion) || idProgramacion <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador de la programación no es válido",
    });

    return;
  }

  try {
    const programacion = await getProgramacionById(idProgramacion);

    response.status(200).json({
      status: "ok",
      message: "Programación consultada correctamente",
      data: programacion,
    });
  } catch (error) {
    if (error instanceof ProgramacionError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al consultar programación:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo consultar la programación",
    });
  }
}

export async function updateProgramacionController(
  request: Request,
  response: Response,
): Promise<void> {
  const idProgramacion = Number(request.params.id);

  if (!Number.isInteger(idProgramacion) || idProgramacion <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador de la programación no es válido",
    });

    return;
  }

  const validation = updateProgramacionSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const programacion = await updateProgramacion(
      idProgramacion,
      validation.data,
    );

    response.status(200).json({
      status: "ok",
      message: "Programación actualizada correctamente",
      data: programacion,
    });
  } catch (error) {
    if (error instanceof ProgramacionError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al actualizar programación:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo actualizar la programación",
    });
  }
}

export async function cancelProgramacionController(
  request: Request,
  response: Response,
): Promise<void> {
  const idProgramacion = Number(request.params.id);

  if (!Number.isInteger(idProgramacion) || idProgramacion <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador de la programación no es válido",
    });

    return;
  }

  try {
    const programacion = await cancelProgramacion(idProgramacion);

    response.status(200).json({
      status: "ok",
      message: "Sesión cancelada correctamente",
      data: programacion,
    });
  } catch (error) {
    if (error instanceof ProgramacionError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al cancelar programación:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo cancelar la programación",
    });
  }
}
