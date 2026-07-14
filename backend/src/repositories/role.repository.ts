import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface Role extends QueryResultRow {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
  fecha_creacion: Date;
}

export async function findAllRoles(): Promise<Role[]> {
  const result = await pool.query<Role>(`
    SELECT
      id_rol,
      nombre,
      descripcion,
      estado,
      fecha_creacion
    FROM roles
    WHERE estado = 'ACTIVO'
    ORDER BY id_rol
  `);

  return result.rows;
}