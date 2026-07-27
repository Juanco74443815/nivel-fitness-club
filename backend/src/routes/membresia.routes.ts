import { Router } from "express";
import {
  cambiarEstadoMembresiaController,
  createMembresiaController,
  listMembresiasController,
  renovarMembresiaController,
} from "../controllers/membresia.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const membresiaRouter = Router();

membresiaRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista", "Socio"),
  listMembresiasController,
);

membresiaRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  createMembresiaController,
);

membresiaRouter.patch(
  "/:id/renovar",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  renovarMembresiaController,
);

membresiaRouter.patch(
  "/:id/estado",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  cambiarEstadoMembresiaController,
);
