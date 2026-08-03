import type { Request, Response } from "express";
import { obtenerIndicadores } from "../services/indicador.service.js";

export async function obtenerIndicadoresController(
  _request: Request,
  response: Response,
): Promise<void> {
  try {
    const indicadores = await obtenerIndicadores();

    response.status(200).json({
      status: "ok",
      message: "Indicadores consultados correctamente",
      data: indicadores,
    });
  } catch (error) {
    console.error("Error al consultar los indicadores:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudieron consultar los indicadores",
    });
  }
}
