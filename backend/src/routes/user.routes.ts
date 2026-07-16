import { Router } from "express";
import { createUserController } from "../controllers/user.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const userRouter = Router();

userRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador"),
  createUserController,
);