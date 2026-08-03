import type { Request, Response } from "express";
import { publicUrlFor } from "../middlewares/upload.middleware.js";
import {
  actualizarEstadoPago,
  cargarComprobante,
  listarPagos,
  misPagos,
  PagoError,
  registrarPago,
} from "../services/pago.service.js";
import {
  actualizarEstadoPagoSchema,
  registrarPagoSchema,
} from "../validators/pago.validator.js";

export async function registrarPagoController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.auth) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  const validation = registrarPagoSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const pago = await registrarPago(validation.data, request.auth.idUsuario);

    response.status(201).json({
      status: "ok",
      message: "Pago registrado correctamente",
      data: pago,
    });
  } catch (error) {
    if (error instanceof PagoError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al registrar el pago:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo registrar el pago",
    });
  }
}

export async function cargarComprobanteController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.auth) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  const idPago = Number(request.params.id);

  if (!Number.isInteger(idPago) || idPago <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del pago no es válido",
    });

    return;
  }

  if (!request.file) {
    response.status(400).json({
      status: "error",
      message: "Debes adjuntar un archivo de comprobante",
    });

    return;
  }

  try {
    const comprobanteUrl = publicUrlFor("comprobantes", request.file.filename);
    const pago = await cargarComprobante(
      idPago,
      request.auth.idUsuario,
      comprobanteUrl,
    );

    response.status(200).json({
      status: "ok",
      message: "Comprobante cargado correctamente",
      data: pago,
    });
  } catch (error) {
    if (error instanceof PagoError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al cargar el comprobante:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo cargar el comprobante",
    });
  }
}

export async function listarPagosController(
  request: Request,
  response: Response,
): Promise<void> {
  const estado =
    typeof request.query.estado === "string" ? request.query.estado : undefined;

  const idSocioParam =
    typeof request.query.id_socio === "string"
      ? Number(request.query.id_socio)
      : undefined;

  const idSocio =
    idSocioParam !== undefined && Number.isInteger(idSocioParam) && idSocioParam > 0
      ? idSocioParam
      : undefined;

  try {
    const pagos = await listarPagos({ estado, idSocio });

    response.status(200).json({
      status: "ok",
      message: "Pagos consultados correctamente",
      data: pagos,
    });
  } catch (error) {
    console.error("Error al listar los pagos:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudieron consultar los pagos",
    });
  }
}

export async function misPagosController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.auth) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  try {
    const pagos = await misPagos(request.auth.idUsuario);

    response.status(200).json({
      status: "ok",
      message: "Historial de pagos consultado correctamente",
      data: pagos,
    });
  } catch (error) {
    if (error instanceof PagoError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al consultar el historial de pagos:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo consultar el historial de pagos",
    });
  }
}

export async function actualizarEstadoPagoController(
  request: Request,
  response: Response,
): Promise<void> {
  if (!request.auth) {
    response.status(401).json({
      status: "error",
      message: "Token de autenticación requerido",
    });

    return;
  }

  const idPago = Number(request.params.id);

  if (!Number.isInteger(idPago) || idPago <= 0) {
    response.status(400).json({
      status: "error",
      message: "El identificador del pago no es válido",
    });

    return;
  }

  const validation = actualizarEstadoPagoSchema.safeParse(request.body);

  if (!validation.success) {
    response.status(400).json({
      status: "error",
      message: "Los datos enviados no son válidos",
      errors: validation.error.flatten().fieldErrors,
    });

    return;
  }

  try {
    const pago = await actualizarEstadoPago(
      idPago,
      validation.data,
      request.auth.idUsuario,
      request.auth.rol,
    );

    response.status(200).json({
      status: "ok",
      message: "Estado del pago actualizado correctamente",
      data: pago,
    });
  } catch (error) {
    if (error instanceof PagoError) {
      response.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    console.error("Error al actualizar el estado del pago:", error);

    response.status(500).json({
      status: "error",
      message: "No se pudo actualizar el estado del pago",
    });
  }
}
