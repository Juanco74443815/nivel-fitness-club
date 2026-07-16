import { Router } from "express";
import {
  loginController,
  logoutController,
} from "../controllers/auth.controller.js";
import { profileController } from "../controllers/profile.controller.js";
import { requireAuthentication } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/login", loginController);

authRouter.post(
  "/logout",
  requireAuthentication,
  logoutController,
);

authRouter.get(
  "/profile",
  requireAuthentication,
  profileController,
);