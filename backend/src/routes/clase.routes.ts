import { Router } from "express";
import {
  createClaseController,
  deactivateClaseController,
  getClaseController,
  listClasesController,
  updateClaseController,
} from "../controllers/clase.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const claseRouter = Router();

claseRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista", "Socio"),
  listClasesController,
);

claseRouter.get(
  "/:id",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista", "Socio"),
  getClaseController,
);

claseRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador"),
  createClaseController,
);

claseRouter.patch(
  "/:id",
  requireAuthentication,
  authorizeRoles("Administrador"),
  updateClaseController,
);

claseRouter.patch(
  "/:id/deactivate",
  requireAuthentication,
  authorizeRoles("Administrador"),
  deactivateClaseController,
);
