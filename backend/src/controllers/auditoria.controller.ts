import type { Request, Response } from "express";
import { consultarAuditoria } from "../services/auditoria.service.js";

export async function consultarAuditoriaController(
  request: Request,
  response: Response,
): Promise<void> {
  const idUsuarioParam =
    typeof request.query.id_usuario === "string"
      ? Number(request.query.id_usuario)
      : undefined;

  const idUsuario =
    idUsuarioParam !== undefined && Number.isInteger(idUsuarioParam) && idUsuarioParam > 0
      ? idUsuarioParam
      : undefined;

  const desde =
    typeof request.query.desde === "string" ? request.query.desde : undefined;
  const hasta =
    typeof request.query.hasta === "string" ? request.query.hasta : undefined;

  try {
    const registros = await consultarAuditoria({ idUsuario, desde, hasta });

    response.status(200).json({
      status: "ok",
      message: "Registro de auditoría consultado correctamente",
      data: registros,
    });
  } catch (error) {
    console.error("Error al consultar la auditoría:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo consultar el registro de auditoría",
    });
  }
}
