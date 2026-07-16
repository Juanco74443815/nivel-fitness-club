import type { AuthenticatedTokenUser } from "./auth.js";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedTokenUser;
    }
  }
}

export {};