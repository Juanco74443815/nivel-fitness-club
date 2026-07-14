import type { Request, Response } from "express";
import {
  AuthenticationError,
  login,
} from "../services/auth.service.js";
import { loginSchema } from "../validators/auth.validator.js";

export async function loginController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = loginSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const result = await login(validation.data);

    response.status(200).json({
      status: "ok",
      message: "Inicio de sesión correcto",
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error durante el inicio de sesión:", error);

    response.status(500).json({
      status: "error",
      message: "Ocurrió un error interno al iniciar sesión",
    });
  }
}