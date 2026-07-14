import "dotenv/config";
import { SignJWT } from "jose";

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