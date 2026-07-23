import { Router } from "express";
import { createReservaController } from "../controllers/reserva.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const reservaRouter = Router();

reservaRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Socio"),
  createReservaController,
);
