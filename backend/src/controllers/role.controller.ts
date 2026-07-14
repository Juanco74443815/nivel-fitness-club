import type { Request, Response } from "express";
import { listRoles } from "../services/role.service.js";

export async function getRoles(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const roles = await listRoles();

    response.status(200).json({
      status: "ok",
      message: "Roles consultados correctamente",
      data: roles,
    });
  } catch (error) {
    console.error("Error al consultar roles:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudieron consultar los roles",
    });
  }
}