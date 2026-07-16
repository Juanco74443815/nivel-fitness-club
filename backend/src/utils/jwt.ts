import "dotenv/config";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import type { AuthenticatedTokenUser } from "../types/auth.js";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error(
    "JWT_SECRET no está configurado o tiene menos de 32 caracteres.",
  );
}

const encodedSecret = new TextEncoder().encode(jwtSecret);

interface AccessTokenPayload {
  idUsuario: number;
  idRol: number;
  rol: string;
  correo: string;
}

const verifiedTokenSchema = z.object({
  sub: z.string().regex(/^\d+$/),
  id_rol: z.number().int().positive(),
  rol: z.string().min(1),
  correo: z.string().email(),
});

export async function createAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return new SignJWT({
    id_rol: payload.idRol,
    rol: payload.rol,
    correo: payload.correo,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setSubject(String(payload.idUsuario))
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "8h")
    .sign(encodedSecret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AuthenticatedTokenUser> {
  const { payload } = await jwtVerify(token, encodedSecret, {
    algorithms: ["HS256"],
  });

  const claims = verifiedTokenSchema.parse(payload);

  return {
    idUsuario: Number(claims.sub),
    idRol: claims.id_rol,
    rol: claims.rol,
    correo: claims.correo,
  };
}