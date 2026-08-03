import { Router } from "express";
import {
  cargarFotoAlimentoController,
  misConsultasNutricionalesController,
} from "../controllers/nutricion.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";
import { uploadFotoAlimento } from "../middlewares/upload.middleware.js";

export const nutricionRouter = Router();

nutricionRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Socio"),
  misConsultasNutricionalesController,
);

nutricionRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Socio"),
  uploadFotoAlimento.single("foto"),
  cargarFotoAlimentoController,
);
