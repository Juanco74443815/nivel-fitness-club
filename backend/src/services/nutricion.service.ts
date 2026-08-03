import fs from "node:fs";
import {
  createConsultaNutricional,
  findConsultasBySocio,
  type ConsultaNutricionalRecord,
} from "../repositories/consulta-nutricional.repository.js";
import { findSocioByUsuarioId } from "../repositories/reserva.repository.js";
import { analizarFotoAlimento } from "./ia-nutricion.service.js";

export class NutricionError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "NutricionError";
  }
}

export async function procesarFotoAlimento(
  idUsuarioAutenticado: number,
  imagenUrl: string,
  imagenAbsolutePath: string,
  mimeType: string,
): Promise<ConsultaNutricionalRecord> {
  const socio = await findSocioByUsuarioId(idUsuarioAutenticado);

  if (!socio) {
    throw new NutricionError(
      403,
      "La cuenta autenticada no está vinculada a ningún socio",
    );
  }

  const imagenBase64 = await fs.promises.readFile(imagenAbsolutePath, {
    encoding: "base64",
  });

  const resultado = await analizarFotoAlimento(imagenBase64, mimeType);

  if (!resultado.identificado) {
    return createConsultaNutricional({
      idSocio: socio.id_socio,
      imagenUrl,
      alimentosDetectados: resultado.alimentosDetectados,
      caloriasEstimadas: null,
      proteinasG: null,
      carbohidratosG: null,
      grasasG: null,
      estado: "ERROR",
    });
  }

  return createConsultaNutricional({
    idSocio: socio.id_socio,
    imagenUrl,
    alimentosDetectados: resultado.alimentosDetectados,
    caloriasEstimadas: resultado.caloriasEstimadas,
    proteinasG: resultado.proteinasG,
    carbohidratosG: resultado.carbohidratosG,
    grasasG: resultado.grasasG,
    estado: "COMPLETADO",
  });
}

export async function misConsultasNutricionales(
  idUsuarioAutenticado: number,
): Promise<ConsultaNutricionalRecord[]> {
  const socio = await findSocioByUsuarioId(idUsuarioAutenticado);

  if (!socio) {
    throw new NutricionError(
      403,
      "La cuenta autenticada no está vinculada a ningún socio",
    );
  }

  return findConsultasBySocio(socio.id_socio);
}
