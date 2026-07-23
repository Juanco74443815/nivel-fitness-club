import { Router } from "express";
import {
  cancelProgramacionController,
  createProgramacionController,
  getProgramacionController,
  listProgramacionesController,
  updateProgramacionController,
} from "../controllers/programacion.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const programacionRouter = Router();

programacionRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista", "Socio"),
  listProgramacionesController,
);

programacionRouter.get(
  "/:id",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista", "Socio"),
  getProgramacionController,
);

programacionRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador"),
  createProgramacionController,
);

programacionRouter.patch(
  "/:id",
  requireAuthentication,
  authorizeRoles("Administrador"),
  updateProgramacionController,
);

programacionRouter.patch(
  "/:id/cancel",
  requireAuthentication,
  authorizeRoles("Administrador"),
  cancelProgramacionController,
);
