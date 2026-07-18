import { z } from "zod";

export const createUserSchema = z.object({
  id_rol: z
    .number({
      message: "El rol es obligatorio",
    })
    .int()
    .positive(),

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
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const updateUserSchema = z.object({
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
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;