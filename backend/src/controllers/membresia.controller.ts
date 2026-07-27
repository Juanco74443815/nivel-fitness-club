import type { Request, Response } from "express";
import {
  cambiarEstadoMembresia,
  listMembresias,
  MembresiaError,
  registerMembresia,
  renovarMembresia,
} from "../services/membresia.service.js";
import {
  cambiarEstadoMembresiaSchema,
  createMembresiaSchema,
} from "../validators/membresia.validator.js";

export async function createMembresiaController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = createMembresiaSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const membresia = await registerMembresia(validation.data);

    response.status(201).json({
      status: "ok",
      message: "Membresía registrada correctamente",
      data: membresia,
    });
  } catch (error) {
    if (error instanceof MembresiaError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al registrar membresía:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo registrar la membresía",
    });
  }
}

export async function listMembresiasController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.auth) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  try {
    const membresias = await listMembresias(
      request.auth.idUsuario,
      request.auth.rol,
    );

    response.status(200).json({
      status: "ok",
      message: "Membresías consultadas correctamente",
      data: membresias,
    });
  } catch (error) {
    if (error instanceof MembresiaError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al listar membresías:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudieron consultar las membresías",
    });
  }
}

export async function renovarMembresiaController(
  request: Request,
  response: Response,
): Promise<void> {
  const idMembresia = Number(request.params.id);

  if (!Number.isInteger(idMembresia) || idMembresia <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador de la membresía no es válido",
    });

    return;
  }

  try {
    const membresia = await renovarMembresia(idMembresia);

    response.status(200).json({
      status: "ok",
      message: "Membresía renovada correctamente",
      data: membresia,
    });
  } catch (error) {
    if (error instanceof MembresiaError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al renovar membresía:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo renovar la membresía",
    });
  }
}

export async function cambiarEstadoMembresiaController(
  request: Request,
  response: Response,
): Promise<void> {
  const idMembresia = Number(request.params.id);

  if (!Number.isInteger(idMembresia) || idMembresia <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador de la membresía no es válido",
    });

    return;
  }

  const validation = cambiarEstadoMembresiaSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const membresia = await cambiarEstadoMembresia(idMembresia, validation.data);

    response.status(200).json({
      status: "ok",
      message: "Estado de la membresía actualizado correctamente",
      data: membresia,
    });
  } catch (error) {
    if (error instanceof MembresiaError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al cambiar el estado de la membresía:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo cambiar el estado de la membresía",
    });
  }
}
