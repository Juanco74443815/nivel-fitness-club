import type { Request, Response } from "express";
import { generarReporte } from "../services/reporte.service.js";
import { generarReporteQuerySchema } from "../validators/reporte.validator.js";

export async function generarReporteController(
  request: Request,
  response: Response,
): Promise<void> {
  const validation = generarReporteQuerySchema.safeParse(request.query);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los parámetros del reporte no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const reporte = await generarReporte(validation.data);

    response.status(200).json({
      status: "ok",
      message: "Reporte generado correctamente",
      data: reporte,
    });
  } catch (error) {
    console.error("Error al generar el reporte:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo generar el reporte",
    });
  }
}
