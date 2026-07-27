import type { Request, Response } from "express";
import {
  cancelReserva,
  listReservasSocio,
  registerReserva,
  ReservaError,
} from "../services/reserva.service.js";
import { createReservaSchema } from "../validators/reserva.validator.js";

export async function createReservaController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = createReservaSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
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
    const reserva = await registerReserva(
      request.auth.idUsuario,
      validation.data,
    );

    response.status(201).json({
      status: "ok",
      message: "Reserva registrada correctamente",
      data: reserva,
    });
  } catch (error) {
    if (error instanceof ReservaError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al registrar reserva:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo registrar la reserva",
    });
  }
}

export async function listReservasController(
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
    const reservas = await listReservasSocio(request.auth.idUsuario);

    response.status(200).json({
      status: "ok",
      message: "Reservas consultadas correctamente",
      data: reservas,
    });
  } catch (error) {
    if (error instanceof ReservaError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al listar reservas:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudieron consultar las reservas",
    });
  }
}

export async function cancelReservaController(
  request: Request,
  response: Response,
): Promise<void> {
  const idReserva = Number(request.params.id);

  if (!Number.isInteger(idReserva) || idReserva <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador de la reserva no es válido",
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
    const reserva = await cancelReserva(request.auth.idUsuario, idReserva);

    response.status(200).json({
      status: "ok",
      message: "Reserva cancelada correctamente",
      data: reserva,
    });
  } catch (error) {
    if (error instanceof ReservaError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al cancelar reserva:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo cancelar la reserva",
    });
  }
}
