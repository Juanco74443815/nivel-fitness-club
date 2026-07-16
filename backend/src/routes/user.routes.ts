import { Router } from "express";
import {
  createUserController,
  listUsersController,
} from "../controllers/user.controller.js";
import {
  authorizeRoles,
  requireAuthentication,
} from "../middlewares/auth.middleware.js";

export const userRouter = Router();

userRouter.get(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador"),
  listUsersController,
);

userRouter.post(
  "/",
  requireAuthentication,
  authorizeRoles("Administrador"),
  createUserController,
);