import type { Request, Response } from "express";
import {
  PasswordResetError,
  requestPasswordReset,
  resetPassword,
} from "../services/password-reset.service.js";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/password-reset.validator.js";

const GENERIC_MESSAGE =
  "Si el correo está registrado y la cuenta se encuentra activa, se enviarán instrucciones para restablecer la contraseña";

export async function forgotPasswordController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = forgotPasswordSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    await requestPasswordReset(validation.data.correo);
  } catch (error) {
    console.error(
      "Error al procesar la solicitud de recuperación de contraseña:",
      error,
    );
  }

  response.status(200).json({
    status: "ok",
    message: GENERIC_MESSAGE,
  });
}

export async function resetPasswordController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = resetPasswordSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    await resetPassword(validation.data.token, validation.data.password);

    response.status(200).json({
      status: "ok",
      message: "La contraseña se actualizó correctamente",
    });
  } catch (error) {
    if (error instanceof PasswordResetError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al restablecer la contraseña:", error);

    response.status(500).json({
      status: "error",
      message: "Ocurrió un error interno al restablecer la contraseña",
    });
  }
}
