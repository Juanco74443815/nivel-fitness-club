import type { Request, Response } from "express";
import { publicUrlFor } from "../middlewares/upload.middleware.js";
import { IaNutricionError } from "../services/ia-nutricion.service.js";
import {
  misConsultasNutricionales,
  NutricionError,
  procesarFotoAlimento,
} from "../services/nutricion.service.js";

export async function cargarFotoAlimentoController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.auth) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  if (!request.file) {
    response.status(400).json({
      status: "error",
      message: "Debes adjuntar una fotografía del alimento",
    });

    return;
  }

  try {
    const imagenUrl = publicUrlFor("alimentos", request.file.filename);
    const consulta = await procesarFotoAlimento(
      request.auth.idUsuario,
      imagenUrl,
      request.file.path,
      request.file.mimetype,
    );

    response.status(201).json({
      status: "ok",
      message: "Consulta nutricional procesada correctamente",
      data: consulta,
    });
  } catch (error) {
    if (error instanceof NutricionError || error instanceof IaNutricionError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al procesar la foto del alimento:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo procesar la fotografía del alimento",
    });
  }
}

export async function misConsultasNutricionalesController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.auth) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  try {
    const consultas = await misConsultasNutricionales(request.auth.idUsuario);

    response.status(200).json({
      status: "ok",
      message: "Historial nutricional consultado correctamente",
      data: consultas,
    });
  } catch (error) {
    if (error instanceof NutricionError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al consultar el historial nutricional:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo consultar el historial nutricional",
    });
  }
}
