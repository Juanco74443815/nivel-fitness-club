import type { Request, Response } from "express";
import {
    listUsers,
  registerUser,
  UserError,
} from "../services/user.service.js";
import { createUserSchema } from "../validators/user.validator.js";

export async function createUserController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = createUserSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const user = await registerUser(validation.data);

    response.status(201).json({
      status: "ok",
      message: "Usuario registrado correctamente",
      data: user,
    });
  } catch (error) {
    if (error instanceof UserError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al registrar usuario:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo registrar el usuario",
    });
  }
}
export async function listUsersController(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const users = await listUsers();

    response.status(200).json({
      status: "ok",
      message: "Usuarios consultados correctamente",
      data: users,
    });
  } catch (error) {
    console.error("Error al listar usuarios:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudieron consultar los usuarios",
    });
  }
}