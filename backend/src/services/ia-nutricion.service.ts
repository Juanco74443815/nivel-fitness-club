import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

const ResultadoIASchema = z.object({
  identificado: z.boolean(),
  alimentos_detectados: z.string(),
  calorias_estimadas: z.number(),
  proteinas_g: z.number(),
  carbohidratos_g: z.number(),
  grasas_g: z.number(),
});

export interface ResultadoIA {
  identificado: boolean;
  alimentosDetectados: string;
  caloriasEstimadas: number;
  proteinasG: number;
  carbohidratosG: number;
  grasasG: number;
}

export class IaNutricionError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "IaNutricionError";
  }
}

const PROMPT = `Eres un asistente de un gimnasio que analiza fotografías de alimentos para dar una estimación nutricional REFERENCIAL (no un diagnóstico ni un reemplazo de un nutricionista).

Analiza la imagen adjunta e identifica los alimentos visibles. Responde únicamente con el objeto estructurado solicitado:
- "identificado": true si pudiste reconocer al menos un alimento con razonable confianza, false si la imagen no muestra comida identificable.
- "alimentos_detectados": descripción breve en español de los alimentos identificados (por ejemplo "Pechuga de pollo a la plancha con arroz blanco y ensalada"). Si "identificado" es false, explica brevemente por qué no se pudo identificar.
- "calorias_estimadas", "proteinas_g", "carbohidratos_g", "grasas_g": estimación numérica referencial de la porción visible. Si "identificado" es false, usa 0 en los cuatro campos.

No incluyas texto adicional fuera del objeto estructurado.`;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"] as const;
type ImagenMimeType = (typeof ALLOWED_MIME_TYPES)[number];

function esMimeTypeSoportado(mimeType: string): mimeType is ImagenMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export async function analizarFotoAlimento(
  imagenBase64: string,
  mimeType: string,
): Promise<ResultadoIA> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new IaNutricionError(
      503,
      "El servicio de reconocimiento de alimentos no está configurado en este entorno",
    );
  }

  if (!esMimeTypeSoportado(mimeType)) {
    throw new IaNutricionError(400, "El formato de la imagen no es válido");
  }

  const client = new Anthropic({ apiKey });

  let response;

  try {
    response = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      output_config: { format: zodOutputFormat(ResultadoIASchema) },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: imagenBase64 },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
  } catch (error) {
    console.error("Error al llamar al servicio de reconocimiento de alimentos:", error);
    throw new IaNutricionError(
      502,
      "No se pudo comunicar con el servicio de reconocimiento de alimentos",
    );
  }

  const parsed = response.parsed_output;

  if (!parsed) {
    throw new IaNutricionError(
      502,
      "El servicio de reconocimiento de alimentos no devolvió un resultado válido",
    );
  }

  return {
    identificado: parsed.identificado,
    alimentosDetectados: parsed.alimentos_detectados,
    caloriasEstimadas: parsed.calorias_estimadas,
    proteinasG: parsed.proteinas_g,
    carbohidratosG: parsed.carbohidratos_g,
    grasasG: parsed.grasas_g,
  };
}
