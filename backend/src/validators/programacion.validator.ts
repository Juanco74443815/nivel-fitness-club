import { z } from "zod";

const horaSchema = z
  .string()
  .trim()
  .regex(
    /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
    "La hora debe tener el formato HH:MM",
  );

export const createProgramacionSchema = z.object({
  id_clase: z
    .number({
      message: "La clase es obligatoria",
    })
    .int()
    .positive(),

  fecha: z
    .string()
    .trim()
    .date("La fecha no es válida"),

  hora_inicio: horaSchema,

  hora_fin: horaSchema,

  cupo_maximo: z
    .number({
      message: "El cupo máximo es obligatorio",
    })
    .int()
    .positive("El cupo máximo debe ser mayor a cero"),
});

export const updateProgramacionSchema = z.object({
  fecha: z
    .string()
    .trim()
    .date("La fecha no es válida")
    .optional(),

  hora_inicio: horaSchema.optional(),

  hora_fin: horaSchema.optional(),

  cupo_maximo: z
    .number()
    .int()
    .positive("El cupo máximo debe ser mayor a cero")
    .optional(),
});

export type CreateProgramacionInput = z.infer<
  typeof createProgramacionSchema
>;
export type UpdateProgramacionInput = z.infer<
  typeof updateProgramacionSchema
>;
