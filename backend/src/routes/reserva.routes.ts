import { Router } from "express";
import {
  cancelReservaController,
  createReservaController,
  listReservasController,
} from "../controllers/reserva.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const reservaRouter = Router();

reservaRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Socio"),
  listReservasController,
);

reservaRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Socio"),
  createReservaController,
);

reservaRouter.patch(
  "/:id/cancel",
  requireAuthentication,
  authorizeRoles("Socio"),
  cancelReservaController,
);
