import type { Request, Response } from "express";
import {
  changeUserRole,
  deactivateUser,
  listUsers,
  registerUser,
  updateUser,
  UserError,
} from "../services/user.service.js";
import {
  changeUserRoleSchema,
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validator.js";

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
export async function updateUserController(
  request: Request,
  response: Response,
): Promise<void> {
  const idUsuario = Number(request.params.id);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del usuario no es válido",
    });

    return;
  }

  const validation = updateUserSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const user = await updateUser(idUsuario, validation.data);

    response.status(200).json({
      status: "ok",
      message: "Usuario actualizado correctamente",
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

    console.error("Error al actualizar usuario:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo actualizar el usuario",
    });
  }
}

export async function changeUserRoleController(
  request: Request,
  response: Response,
): Promise<void> {
  const idUsuario = Number(request.params.id);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del usuario no es válido",
    });

    return;
  }

  const validation = changeUserRoleSchema.safeParse(request.body);

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
    const user = await changeUserRole(
      idUsuario,
      validation.data,
      request.auth.idUsuario,
    );

    response.status(200).json({
      status: "ok",
      message: "Rol de usuario actualizado correctamente",
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

    console.error("Error al actualizar el rol del usuario:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo actualizar el rol del usuario",
    });
  }
}

export async function deactivateUserController(
  request: Request,
  response: Response,
): Promise<void> {
  const idUsuario = Number(request.params.id);

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del usuario no es válido",
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
    const user = await deactivateUser(idUsuario, request.auth.idUsuario);

    response.status(200).json({
      status: "ok",
      message: "Usuario desactivado correctamente",
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

    console.error("Error al desactivar el usuario:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo desactivar el usuario",
    });
  }
}