import type {
  NextFunction,
  Request,
  Response,
} from "express";
import { verifyAccessToken } from "../utils/jwt.js";

export async function requireAuthentication(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    response.status(401).json({
      status: "error",
      message: "Formato de token no válido",
    });

    return;
  }

  try {
    request.auth = await verifyAccessToken(token);
    next();
  } catch (error) {
    console.error("Error al verificar el token:", error);

    response.status(401).json({
      status: "error",
      message: "Token inválido o expirado",
    });
  }
}