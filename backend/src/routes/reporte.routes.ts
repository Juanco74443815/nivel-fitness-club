import { Router } from "express";
import { generarReporteController } from "../controllers/reporte.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const reporteRouter = Router();

reporteRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador"),
  generarReporteController,
);
