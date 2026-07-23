import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface ClaseRecord extends QueryResultRow {
  id_clase: number;
  nombre: string;
  descripcion: string | null;
  instructor: string | null;
  estado: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export async function createClase(data: {
  nombre: string;
  descripcion: string | null;
  instructor: string | null;
}): Promise<ClaseRecord> {
  const result = await pool.query<ClaseRecord>(
    `
      INSERT INTO clases (nombre, descripcion, instructor)
      VALUES ($1, $2, $3)
      RETURNING
        id_clase,
        nombre,
        descripcion,
        instructor,
        estado,
        fecha_creacion,
        fecha_actualizacion
    `,
    [data.nombre, data.descripcion, data.instructor],
  );

  return result.rows[0];
}

export async function findAllClases(filters: {
  estado?: string;
  busqueda?: string;
}): Promise<ClaseRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.estado) {
    values.push(filters.estado);
    conditions.push(`estado = $${values.length}`);
  }

  if (filters.busqueda) {
    values.push(`%${filters.busqueda.toLowerCase()}%`);
    const placeholder = `$${values.length}`;
    conditions.push(
      `(
        LOWER(nombre) LIKE ${placeholder}
        OR LOWER(COALESCE(instructor, '')) LIKE ${placeholder}
      )`,
    );
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query<ClaseRecord>(
    `
      SELECT
        id_clase,
        nombre,
        descripcion,
        instructor,
        estado,
        fecha_creacion,
        fecha_actualizacion
      FROM clases
      ${whereClause}
      ORDER BY id_clase DESC
    `,
    values,
  );

  return result.rows;
}

export async function findClaseById(
  idClase: number,
): Promise<ClaseRecord | null> {
  const result = await pool.query<ClaseRecord>(
    `
      SELECT
        id_clase,
        nombre,
        descripcion,
        instructor,
        estado,
        fecha_creacion,
        fecha_actualizacion
      FROM clases
      WHERE id_clase = $1
      LIMIT 1
    `,
    [idClase],
  );

  return result.rows[0] ?? null;
}

export async function updateClaseById(data: {
  idClase: number;
  nombre: string;
  descripcion: string | null;
  instructor: string | null;
}): Promise<ClaseRecord> {
  const result = await pool.query<ClaseRecord>(
    `
      UPDATE clases
      SET
        nombre = $1,
        descripcion = $2,
        instructor = $3,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_clase = $4
      RETURNING
        id_clase,
        nombre,
        descripcion,
        instructor,
        estado,
        fecha_creacion,
        fecha_actualizacion
    `,
    [data.nombre, data.descripcion, data.instructor, data.idClase],
  );

  return result.rows[0];
}

export async function deactivateClaseById(
  idClase: number,
): Promise<ClaseRecord> {
  const result = await pool.query<ClaseRecord>(
    `
      UPDATE clases
      SET
        estado = 'INACTIVO',
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_clase = $1
      RETURNING
        id_clase,
        nombre,
        descripcion,
        instructor,
        estado,
        fecha_creacion,
        fecha_actualizacion
    `,
    [idClase],
  );

  return result.rows[0];
}
