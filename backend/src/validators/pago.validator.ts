import { z } from "zod";

const METODOS_PAGO = ["EFECTIVO", "TRANSFERENCIA", "QR"] as const;

export const registrarPagoSchema = z.object({
  id_socio: z
    .number({
      message: "El socio es obligatorio",
    })
    .int()
    .positive(),

  id_membresia: z.number().int().positive().optional(),

  monto: z
    .number({
      message: "El monto es obligatorio",
    })
    .positive("El monto debe ser un valor positivo"),

  metodo_pago: z.enum(METODOS_PAGO, {
    message: "El método de pago no es válido",
  }),
});

const ESTADOS_ACTUALIZABLES = ["VERIFICADO", "RECHAZADO", "ANULADO"] as const;

export const actualizarEstadoPagoSchema = z
  .object({
    estado: z.enum(ESTADOS_ACTUALIZABLES, {
      message: "El estado indicado no es válido",
    }),
    motivo: z.string().trim().min(1).max(255).optional(),
  })
  .refine((data) => data.estado === "VERIFICADO" || !!data.motivo, {
    message: "El motivo es obligatorio para rechazar o anular un pago",
    path: ["motivo"],
  });

export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>;
export type ActualizarEstadoPagoInput = z.infer<typeof actualizarEstadoPagoSchema>;
