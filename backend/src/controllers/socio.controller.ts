import type { Request, Response } from "express";
import {
  deactivateSocio,
  getSocioById,
  listSocios,
  registerSocio,
  SocioError,
  updateSocio,
} from "../services/socio.service.js";
import {
  createSocioSchema,
  updateSocioSchema,
} from "../validators/socio.validator.js";

export async function createSocioController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = createSocioSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const socio = await registerSocio(validation.data);

    response.status(201).json({
      status: "ok",
      message: "Socio registrado correctamente",
      data: socio,
    });
  } catch (error) {
    if (error instanceof SocioError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al registrar socio:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo registrar el socio",
    });
  }
}

export async function listSociosController(
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

  try {
    const socios = await listSocios({
      estado: estadoParam,
      busqueda: busquedaParam,
    });

    response.status(200).json({
      status: "ok",
      message: "Socios consultados correctamente",
      data: socios,
    });
  } catch (error) {
    console.error("Error al listar socios:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudieron consultar los socios",
    });
  }
}

export async function getSocioController(
  request: Request,
  response: Response,
): Promise<void> {
  const idSocio = Number(request.params.id);

  if (!Number.isInteger(idSocio) || idSocio <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del socio no es válido",
    });

    return;
  }

  try {
    const socio = await getSocioById(idSocio);

    response.status(200).json({
      status: "ok",
      message: "Socio consultado correctamente",
      data: socio,
    });
  } catch (error) {
    if (error instanceof SocioError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al consultar socio:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo consultar el socio",
    });
  }
}

export async function updateSocioController(
  request: Request,
  response: Response,
): Promise<void> {
  const idSocio = Number(request.params.id);

  if (!Number.isInteger(idSocio) || idSocio <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del socio no es válido",
    });

    return;
  }

  const validation = updateSocioSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const socio = await updateSocio(idSocio, validation.data);

    response.status(200).json({
      status: "ok",
      message: "Socio actualizado correctamente",
      data: socio,
    });
  } catch (error) {
    if (error instanceof SocioError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al actualizar socio:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo actualizar el socio",
    });
  }
}

export async function deactivateSocioController(
  request: Request,
  response: Response,
): Promise<void> {
  const idSocio = Number(request.params.id);

  if (!Number.isInteger(idSocio) || idSocio <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del socio no es válido",
    });

    return;
  }

  try {
    const socio = await deactivateSocio(idSocio);

    response.status(200).json({
      status: "ok",
      message: "Socio desactivado correctamente",
      data: socio,
    });
  } catch (error) {
    if (error instanceof SocioError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al desactivar socio:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo desactivar el socio",
    });
  }
}
