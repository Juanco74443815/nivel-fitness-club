import { Router } from "express";
import {
  actualizarEstadoPagoController,
  cargarComprobanteController,
  listarPagosController,
  misPagosController,
  registrarPagoController,
} from "../controllers/pago.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";
import { uploadComprobante } from "../middlewares/upload.middleware.js";

export const pagoRouter = Router();

pagoRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  listarPagosController,
);

pagoRouter.get(
  "/mios",
  requireAuthentication,
  authorizeRoles("Socio"),
  misPagosController,
);

pagoRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  registrarPagoController,
);

pagoRouter.post(
  "/:id/comprobante",
  requireAuthentication,
  authorizeRoles("Socio"),
  uploadComprobante.single("comprobante"),
  cargarComprobanteController,
);

pagoRouter.patch(
  "/:id/estado",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  actualizarEstadoPagoController,
);
