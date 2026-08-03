import { findMembresiaById } from "../repositories/membresia.repository.js";
import { findSocioByUsuarioId } from "../repositories/reserva.repository.js";
import { findSocioById } from "../repositories/socio.repository.js";
import {
  createPago,
  findAllPagos,
  findPagoById,
  findPagosBySocio,
  type PagoRecord,
  updateComprobantePago,
  updateEstadoPago,
} from "../repositories/pago.repository.js";
import type {
  ActualizarEstadoPagoInput,
  RegistrarPagoInput,
} from "../validators/pago.validator.js";

export class PagoError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "PagoError";
  }
}

export async function registrarPago(
  input: RegistrarPagoInput,
  actorUserId: number,
): Promise<PagoRecord> {
  const socio = await findSocioById(input.id_socio);

  if (!socio) {
    throw new PagoError(400, "El socio seleccionado no existe");
  }

  if (socio.estado !== "ACTIVO") {
    throw new PagoError(400, "El socio seleccionado se encuentra inactivo");
  }

  if (input.id_membresia) {
    const membresia = await findMembresiaById(input.id_membresia);

    if (!membresia) {
      throw new PagoError(400, "La membresía seleccionada no existe");
    }

    if (membresia.id_socio !== input.id_socio) {
      throw new PagoError(
        400,
        "La membresía seleccionada no pertenece al socio indicado",
      );
    }
  }

  // Los pagos en efectivo se registran directamente por el personal y
  // quedan verificados de inmediato (HDU-29, observación). Transferencia y
  // QR quedan pendientes hasta que el socio cargue el comprobante y el
  // personal lo verifique (HDU-30 y HDU-32).
  const estado = input.metodo_pago === "EFECTIVO" ? "VERIFICADO" : "PENDIENTE";

  return createPago({
    idSocio: input.id_socio,
    idMembresia: input.id_membresia ?? null,
    monto: input.monto,
    metodoPago: input.metodo_pago,
    estado,
    verificadoPor: estado === "VERIFICADO" ? actorUserId : null,
  });
}

export async function cargarComprobante(
  idPago: number,
  idUsuarioAutenticado: number,
  comprobanteUrl: string,
): Promise<PagoRecord> {
  const socio = await findSocioByUsuarioId(idUsuarioAutenticado);

  if (!socio) {
    throw new PagoError(
      403,
      "La cuenta autenticada no está vinculada a ningún socio",
    );
  }

  const pago = await findPagoById(idPago);

  if (!pago) {
    throw new PagoError(404, "El pago seleccionado no existe");
  }

  if (pago.id_socio !== socio.id_socio) {
    throw new PagoError(
      403,
      "No puedes cargar un comprobante para un pago que no es tuyo",
    );
  }

  if (pago.estado !== "PENDIENTE") {
    throw new PagoError(
      409,
      "Solo se puede cargar un comprobante mientras el pago está pendiente de verificación",
    );
  }

  return updateComprobantePago(idPago, comprobanteUrl);
}

export async function listarPagos(filters: {
  estado?: string;
  idSocio?: number;
}): Promise<PagoRecord[]> {
  return findAllPagos(filters);
}

export async function misPagos(
  idUsuarioAutenticado: number,
): Promise<PagoRecord[]> {
  const socio = await findSocioByUsuarioId(idUsuarioAutenticado);

  if (!socio) {
    throw new PagoError(
      403,
      "La cuenta autenticada no está vinculada a ningún socio",
    );
  }

  return findPagosBySocio(socio.id_socio);
}

export async function actualizarEstadoPago(
  idPago: number,
  input: ActualizarEstadoPagoInput,
  actorUserId: number,
  actorRole: string,
): Promise<PagoRecord> {
  const pago = await findPagoById(idPago);

  if (!pago) {
    throw new PagoError(404, "El pago seleccionado no existe");
  }

  if (input.estado === "ANULADO" && actorRole !== "Administrador") {
    throw new PagoError(403, "Solo el Administrador puede anular un pago");
  }

  if (
    (input.estado === "VERIFICADO" || input.estado === "RECHAZADO") &&
    pago.estado !== "PENDIENTE"
  ) {
    throw new PagoError(
      409,
      "Solo se puede verificar o rechazar un pago que está pendiente",
    );
  }

  if (input.estado === "ANULADO" && pago.estado !== "VERIFICADO") {
    throw new PagoError(
      409,
      "Solo se puede anular un pago que ya fue verificado",
    );
  }

  return updateEstadoPago({
    idPago,
    estado: input.estado,
    observaciones: input.estado === "VERIFICADO" ? null : input.motivo ?? null,
    verificadoPor: actorUserId,
  });
}
