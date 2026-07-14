import { Router } from "express";
import { getRoles } from "../controllers/role.controller.js";

export const roleRouter = Router();

roleRouter.get("/", getRoles);