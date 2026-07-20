import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { findActiveUserIdByEmail } from "../repositories/auth.repository.js";
import {
  applyPasswordResetTransaction,
  createResetToken,
  findValidTokenByHash,
  invalidateActiveTokensForUser,
} from "../repositories/password-reset.repository.js";
import { sendPasswordResetEmail } from "./email.service.js";

export class PasswordResetError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "PasswordResetError";
  }
}

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export interface RequestPasswordResetOptions {
  onTokenGenerated?: (rawToken: string) => void;
}

export async function requestPasswordReset(
  correo: string,
  options?: RequestPasswordResetOptions,
): Promise<void> {
  const user = await findActiveUserIdByEmail(correo);

  if (!user) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiresMinutes = Number(
    process.env.PASSWORD_RESET_EXPIRES_MINUTES ?? 30,
  );
  const expiresAt = new Date(Date.now() + expiresMinutes * 60_000);

  await invalidateActiveTokensForUser(user.id_usuario);
  await createResetToken({
    idUsuario: user.id_usuario,
    tokenHash,
    expiresAt,
  });

  options?.onTokenGenerated?.(rawToken);

  const resetBaseUrl =
    process.env.PASSWORD_RESET_URL ??
    "http://localhost:5173/restablecer-password";
  const resetUrl = `${resetBaseUrl}?token=${rawToken}`;

  await sendPasswordResetEmail(correo, resetUrl);
}

export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const tokenRecord = await findValidTokenByHash(tokenHash);

  if (!tokenRecord) {
    throw new PasswordResetError(
      400,
      "El token de restablecimiento no es válido o ha expirado",
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await applyPasswordResetTransaction({
    idUsuario: tokenRecord.id_usuario,
    idToken: tokenRecord.id_token,
    passwordHash,
  });
}
