import { z } from "zod";

export const forgotPasswordSchema = z.object({
  correo: z
    .string()
    .trim()
    .email("El correo electrónico no es válido")
    .transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "El token es obligatorio"),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
