import type { Request, Response } from "express";
import {
  ClaseError,
  deactivateClase,
  getClaseById,
  listClases,
  registerClase,
  updateClase,
} from "../services/clase.service.js";
import {
  createClaseSchema,
  updateClaseSchema,
} from "../validators/clase.validator.js";

export async function createClaseController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = createClaseSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const clase = await registerClase(validation.data);

    response.status(201).json({
      status: "ok",
      message: "Clase registrada correctamente",
      data: clase,
    });
  } catch (error) {
    if (error instanceof ClaseError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al registrar clase:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo registrar la clase",
    });
  }
}

export async function listClasesController(
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

  const busquedaParam =
    typeof request.query.q === "string" && request.query.q.trim()
      ? request.query.q.trim()
      : undefined;

  if (!request.auth) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  try {
    const clases = await listClases(
      { estado: estadoParam, busqueda: busquedaParam },
      request.auth.rol,
    );

    response.status(200).json({
      status: "ok",
      message: "Clases consultadas correctamente",
      data: clases,
    });
  } catch (error) {
    console.error("Error al listar clases:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudieron consultar las clases",
    });
  }
}

export async function getClaseController(
  request: Request,
  response: Response,
): Promise<void> {
  const idClase = Number(request.params.id);

  if (!Number.isInteger(idClase) || idClase <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador de la clase no es válido",
    });

    return;
  }

  try {
    const clase = await getClaseById(idClase);

    response.status(200).json({
      status: "ok",
      message: "Clase consultada correctamente",
      data: clase,
    });
  } catch (error) {
    if (error instanceof ClaseError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al consultar clase:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo consultar la clase",
    });
  }
}

export async function updateClaseController(
  request: Request,
  response: Response,
): Promise<void> {
  const idClase = Number(request.params.id);

  if (!Number.isInteger(idClase) || idClase <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador de la clase no es válido",
    });

    return;
  }

  const validation = updateClaseSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const clase = await updateClase(idClase, validation.data);

    response.status(200).json({
      status: "ok",
      message: "Clase actualizada correctamente",
      data: clase,
    });
  } catch (error) {
    if (error instanceof ClaseError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al actualizar clase:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo actualizar la clase",
    });
  }
}

export async function deactivateClaseController(
  request: Request,
  response: Response,
): Promise<void> {
  const idClase = Number(request.params.id);

  if (!Number.isInteger(idClase) || idClase <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador de la clase no es válido",
    });

    return;
  }

  try {
    const clase = await deactivateClase(idClase);

    response.status(200).json({
      status: "ok",
      message: "Clase desactivada correctamente",
      data: clase,
    });
  } catch (error) {
    if (error instanceof ClaseError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al desactivar clase:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo desactivar la clase",
    });
  }
}
