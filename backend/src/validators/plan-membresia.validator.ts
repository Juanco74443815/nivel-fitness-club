import { z } from "zod";

export const createPlanMembresiaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre del plan es obligatorio")
    .max(100),

  descripcion: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),

  duracion_dias: z
    .number({
      message: "La duración en días es obligatoria",
    })
    .int()
    .positive("La duración debe ser mayor a cero"),

  precio: z
    .number({
      message: "El precio es obligatorio",
    })
    .positive("El precio debe ser mayor a cero"),
});

export const updatePlanMembresiaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre del plan es obligatorio")
    .max(100)
    .optional(),

  descripcion: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),

  duracion_dias: z
    .number()
    .int()
    .positive("La duración debe ser mayor a cero")
    .optional(),

  precio: z
    .number()
    .positive("El precio debe ser mayor a cero")
    .optional(),
});

export type CreatePlanMembresiaInput = z.infer<typeof createPlanMembresiaSchema>;
export type UpdatePlanMembresiaInput = z.infer<typeof updatePlanMembresiaSchema>;
