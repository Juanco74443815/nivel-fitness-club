import { Router } from "express";
import { obtenerIndicadoresController } from "../controllers/indicador.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const indicadorRouter = Router();

indicadorRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador"),
  obtenerIndicadoresController,
);
