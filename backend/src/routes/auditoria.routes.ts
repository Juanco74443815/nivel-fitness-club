import { Router } from "express";
import { consultarAuditoriaController } from "../controllers/auditoria.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const auditoriaRouter = Router();

auditoriaRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador"),
  consultarAuditoriaController,
);
