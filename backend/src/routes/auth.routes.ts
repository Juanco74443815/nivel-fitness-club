import { Router } from "express";
import { loginController } from "../controllers/auth.controller.js";
import { profileController } from "../controllers/profile.controller.js";
import { requireAuthentication } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/login", loginController);

authRouter.get(
  "/profile",
  requireAuthentication,
  profileController,
);