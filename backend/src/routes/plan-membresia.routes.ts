import { Router } from "express";
import {
  createPlanController,
  deactivatePlanController,
  getPlanController,
  listPlanesController,
  updatePlanController,
} from "../controllers/plan-membresia.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const planMembresiaRouter = Router();

planMembresiaRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista", "Socio"),
  listPlanesController,
);

planMembresiaRouter.get(
  "/:id",
  requireAuthentication,
  authorizeRoles("Administrador", "Recepcionista", "Socio"),
  getPlanController,
);

planMembresiaRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador"),
  createPlanController,
);

planMembresiaRouter.patch(
  "/:id",
  requireAuthentication,
  authorizeRoles("Administrador"),
  updatePlanController,
);

planMembresiaRouter.patch(
  "/:id/deactivate",
  requireAuthentication,
  authorizeRoles("Administrador"),
  deactivatePlanController,
);
