import type { Request, Response } from "express";
import { registerReserva, ReservaError } from "../services/reserva.service.js";
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
