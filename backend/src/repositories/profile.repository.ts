import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface UserProfileRecord extends QueryResultRow {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  ci: string | null;
  telefono: string | null;
  correo: string;
  estado: string;
  fecha_creacion: Date;
  ultimo_acceso: Date | null;
  id_rol: number;
  rol: string;
  estado_rol: string;
}

export async function findUserProfileById(
  idUsuario: number,
): Promise<UserProfileRecord | null> {
  const result = await pool.query<UserProfileRecord>(
    `
      SELECT
        u.id_usuario,
        u.nombres,
        u.apellidos,
        u.ci,
        u.telefono,
        u.correo,
        u.estado,
        u.fecha_creacion,
        u.ultimo_acceso,
        r.id_rol,
        r.nombre AS rol,
        r.estado AS estado_rol
      FROM usuarios u
      INNER JOIN roles r
        ON r.id_rol = u.id_rol
      WHERE u.id_usuario = $1
      LIMIT 1
    `,
    [idUsuario],
  );

  return result.rows[0] ?? null;
}