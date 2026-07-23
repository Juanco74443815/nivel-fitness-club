import { z } from "zod";

export const createReservaSchema = z.object({
  id_programacion: z
    .number({
      message: "La sesión a reservar es obligatoria",
    })
    .int()
    .positive(),
});

export type CreateReservaInput = z.infer<typeof createReservaSchema>;
