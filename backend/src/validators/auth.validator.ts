import { z } from "zod";

export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .email("El correo electrónico no es válido")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;