import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface UserRecord extends QueryResultRow {
  id_usuario: number;
  id_rol: number;
  nombres: string;
  apellidos: string;
  ci: string | null;
  telefono: string | null;
  correo: string;
  estado: string;
  fecha_creacion: Date;
  ultimo_acceso: Date | null;
  rol: string;
}

export async function findActiveRoleById(
  idRol: number,
): Promise<{ id_rol: number; nombre: string } | null> {
  const result = await pool.query<{
    id_rol: number;
    nombre: string;
  }>(
    `
      SELECT id_rol, nombre
      FROM roles
      WHERE id_rol = $1
        AND estado = 'ACTIVO'
      LIMIT 1
    `,
    [idRol],
  );

  return result.rows[0] ?? null;
}

export async function findUserByEmailForValidation(
  correo: string,
): Promise<{ id_usuario: number } | null> {
  const result = await pool.query<{ id_usuario: number }>(
    `
      SELECT id_usuario
      FROM usuarios
      WHERE LOWER(correo) = LOWER($1)
      LIMIT 1
    `,
    [correo],
  );

  return result.rows[0] ?? null;
}

export async function findUserByCiForValidation(
  ci: string,
): Promise<{ id_usuario: number } | null> {
  const result = await pool.query<{ id_usuario: number }>(
    `
      SELECT id_usuario
      FROM usuarios
      WHERE ci = $1
      LIMIT 1
    `,
    [ci],
  );

  return result.rows[0] ?? null;
}

export async function createUser(data: {
  idRol: number;
  nombres: string;
  apellidos: string;
  ci: string | null;
  telefono: string | null;
  correo: string;
  passwordHash: string;
}): Promise<UserRecord> {
  const result = await pool.query<UserRecord>(
    `
      INSERT INTO usuarios (
        id_rol,
        nombres,
        apellidos,
        ci,
        telefono,
        correo,
        password_hash
      )
      VALUES ($1, $2, $3, $4, $5, LOWER($6), $7)
      RETURNING
        id_usuario,
        id_rol,
        nombres,
        apellidos,
        ci,
        telefono,
        correo,
        estado,
        fecha_creacion,
        ultimo_acceso,
        (
          SELECT nombre
          FROM roles
          WHERE roles.id_rol = usuarios.id_rol
        ) AS rol
    `,
    [
      data.idRol,
      data.nombres,
      data.apellidos,
      data.ci,
      data.telefono,
      data.correo,
      data.passwordHash,
    ],
  );

  return result.rows[0];
}