import { Router } from "express";
import {
  createSocioController,
  deactivateSocioController,
  getSocioController,
  listSociosController,
  updateSocioController,
} from "../controllers/socio.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const socioRouter = Router();

socioRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  listSociosController,
);

socioRouter.get(
  "/:id",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  getSocioController,
);

socioRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  createSocioController,
);

socioRouter.patch(
  "/:id",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  updateSocioController,
);

socioRouter.patch(
  "/:id/deactivate",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista"),
  deactivateSocioController,
);
