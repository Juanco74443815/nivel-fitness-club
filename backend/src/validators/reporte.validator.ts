import { z } from "zod";

const TIPOS_REPORTE = ["socios", "reservas", "membresias", "pagos"] as const;

export const generarReporteQuerySchema = z
  .object({
    tipo: z.enum(TIPOS_REPORTE, {
      message: "El tipo de reporte no es válido",
    }),
    desde: z.string().trim().date("La fecha 'desde' no es válida"),
    hasta: z.string().trim().date("La fecha 'hasta' no es válida"),
  })
  .refine((data) => data.desde <= data.hasta, {
    message: "La fecha 'desde' no puede ser posterior a la fecha 'hasta'",
    path: ["hasta"],
  });

export type GenerarReporteQuery = z.infer<typeof generarReporteQuerySchema>;
