import type { Request, Response } from "express";
import {
  getProfile,
  ProfileError,
} from "../services/profile.service.js";

export async function profileController(
  request: Request,
  response: Response,
): Promise<void> {
  const authenticatedUser = request.auth;

  if (!authenticatedUser) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  try {
    const profile = await getProfile(
      authenticatedUser.idUsuario,
    );

    response.status(200).json({
      status: "ok",
      message: "Perfil consultado correctamente",
      data: profile,
    });
  } catch (error) {
    if (error instanceof ProfileError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al consultar el perfil:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo consultar el perfil",
    });
  }
}