import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface AuthenticationUser extends QueryResultRow {
  id_usuario: number;
  id_rol: number;
  nombres: string;
  apellidos: string;
  correo: string;
  password_hash: string;
  estado: string;
  rol: string;
  estado_rol: string;
}

export async function findUserByEmail(
  correo: string,
): Promise<AuthenticationUser | null> {
  const result = await pool.query<AuthenticationUser>(
    `
      SELECT
        u.id_usuario,
        u.id_rol,
        u.nombres,
        u.apellidos,
        u.correo,
        u.password_hash,
        u.estado,
        r.nombre AS rol,
        r.estado AS estado_rol
      FROM usuarios u
      INNER JOIN roles r
        ON r.id_rol = u.id_rol
      WHERE LOWER(u.correo) = LOWER($1)
      LIMIT 1
    `,
    [correo],
  );

  return result.rows[0] ?? null;
}

export async function updateLastAccess(
  idUsuario: number,
): Promise<void> {
  await pool.query(
    `
      UPDATE usuarios
      SET ultimo_acceso = CURRENT_TIMESTAMP
      WHERE id_usuario = $1
    `,
    [idUsuario],
  );
}