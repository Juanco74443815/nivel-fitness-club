import { z } from "zod";

export const createMembresiaSchema = z.object({
  id_socio: z
    .number({
      message: "El socio es obligatorio",
    })
    .int()
    .positive(),

  id_plan: z
    .number({
      message: "El plan de membresía es obligatorio",
    })
    .int()
    .positive(),

  fecha_inicio: z
    .string()
    .trim()
    .date("La fecha de inicio no es válida"),
});

const ESTADOS_MEMBRESIA = [
  "PENDIENTE",
  "ACTIVA",
  "VENCIDA",
  "SUSPENDIDA",
  "ANULADA",
] as const;

export const cambiarEstadoMembresiaSchema = z
  .object({
    estado: z.enum(ESTADOS_MEMBRESIA, {
      message: "El estado indicado no es válido",
    }),
    motivo_anulacion: z.string().trim().min(1).max(255).optional(),
  })
  .refine(
    (data) => data.estado !== "ANULADA" || !!data.motivo_anulacion,
    {
      message: "El motivo de anulación es obligatorio para anular una membresía",
      path: ["motivo_anulacion"],
    },
  );

export type CreateMembresiaInput = z.infer<typeof createMembresiaSchema>;
export type CambiarEstadoMembresiaInput = z.infer<
  typeof cambiarEstadoMembresiaSchema
>;
