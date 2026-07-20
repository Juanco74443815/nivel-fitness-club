import { Router } from "express";
import {
  changeUserRoleController,
  createUserController,
  deactivateUserController,
  listUsersController,
  updateUserController,
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
userRouter.patch(
  "/:id",
  requireAuthentication,
  authorizeRoles("Administrador"),
  updateUserController,
);

userRouter.patch(
  "/:id/role",
  requireAuthentication,
  authorizeRoles("Administrador"),
  changeUserRoleController,
);

userRouter.patch(
  "/:id/deactivate",
  requireAuthentication,
  authorizeRoles("Administrador"),
  deactivateUserController,
);