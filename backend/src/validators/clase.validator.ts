import { z } from "zod";

export const createClaseSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre de la clase es obligatorio")
    .max(100),

  descripcion: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),

  instructor: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable(),
});

export const updateClaseSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre de la clase es obligatorio")
    .max(100)
    .optional(),

  descripcion: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable(),

  instructor: z
    .string()
    .trim()
    .max(100)
    .optional()
    .nullable(),
});

export type CreateClaseInput = z.infer<typeof createClaseSchema>;
export type UpdateClaseInput = z.infer<typeof updateClaseSchema>;
