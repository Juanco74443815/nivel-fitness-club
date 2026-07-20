import { Router } from "express";
import { getRoles } from "../controllers/role.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const roleRouter = Router();

roleRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador"),
  getRoles,
);