import { z } from "zod";

export const createSocioSchema = z.object({
  nombres: z
    .string()
    .trim()
    .min(2, "Los nombres son obligatorios")
    .max(80),

  apellidos: z
    .string()
    .trim()
    .min(2, "Los apellidos son obligatorios")
    .max(100),

  ci: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable(),

  telefono: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable(),

  correo: z
    .string()
    .trim()
    .email("El correo electrónico no es válido")
    .max(150)
    .transform((value) => value.toLowerCase())
    .optional()
    .nullable(),

  fecha_nacimiento: z
    .string()
    .trim()
    .date("La fecha de nacimiento no es válida")
    .optional()
    .nullable(),

  id_usuario: z
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),
});

export const updateSocioSchema = z.object({
  nombres: z
    .string()
    .trim()
    .min(2, "Los nombres son obligatorios")
    .max(80)
    .optional(),

  apellidos: z
    .string()
    .trim()
    .min(2, "Los apellidos son obligatorios")
    .max(100)
    .optional(),

  ci: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable(),

  telefono: z
    .string()
    .trim()
    .max(20)
    .optional()
    .nullable(),

  correo: z
    .string()
    .trim()
    .email("El correo electrónico no es válido")
    .max(150)
    .transform((value) => value.toLowerCase())
    .optional()
    .nullable(),

  fecha_nacimiento: z
    .string()
    .trim()
    .date("La fecha de nacimiento no es válida")
    .optional()
    .nullable(),
});

export type CreateSocioInput = z.infer<typeof createSocioSchema>;
export type UpdateSocioInput = z.infer<typeof updateSocioSchema>;
