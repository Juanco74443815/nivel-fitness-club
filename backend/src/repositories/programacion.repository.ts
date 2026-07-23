import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface ProgramacionRecord extends QueryResultRow {
  id_programacion: number;
  id_clase: number;
  clase_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cupo_maximo: number;
  reservas_activas: number;
  cupos_disponibles: number;
  estado: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

const SELECT_FIELDS = `
  p.id_programacion,
  p.id_clase,
  c.nombre AS clase_nombre,
  p.fecha,
  p.hora_inicio,
  p.hora_fin,
  p.cupo_maximo,
  COALESCE(r.reservas_activas, 0)::int AS reservas_activas,
  (p.cupo_maximo - COALESCE(r.reservas_activas, 0)::int) AS cupos_disponibles,
  p.estado,
  p.fecha_creacion,
  p.fecha_actualizacion
`;

const FROM_CLAUSE = `
  FROM programaciones_clase p
  INNER JOIN clases c ON c.id_clase = p.id_clase
  LEFT JOIN (
    SELECT id_programacion, COUNT(*) AS reservas_activas
    FROM reservas
    WHERE estado = 'ACTIVA'
    GROUP BY id_programacion
  ) r ON r.id_programacion = p.id_programacion
`;

export async function findActiveClaseById(
  idClase: number,
): Promise<{ id_clase: number } | null> {
  const result = await pool.query<{ id_clase: number }>(
    `
      SELECT id_clase
      FROM clases
      WHERE id_clase = $1
        AND estado = 'ACTIVO'
      LIMIT 1
    `,
    [idClase],
  );

  return result.rows[0] ?? null;
}

export async function createProgramacion(data: {
  idClase: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cupoMaximo: number;
}): Promise<ProgramacionRecord> {
  const insertResult = await pool.query<{ id_programacion: number }>(
    `
      INSERT INTO programaciones_clase (
        id_clase, fecha, hora_inicio, hora_fin, cupo_maximo
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_programacion
    `,
    [data.idClase, data.fecha, data.horaInicio, data.horaFin, data.cupoMaximo],
  );

  const created = await findProgramacionById(
    insertResult.rows[0].id_programacion,
  );

  return created as ProgramacionRecord;
}

export async function findAllProgramaciones(filters: {
  estado?: string;
  idClase?: number;
}): Promise<ProgramacionRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.estado) {
    values.push(filters.estado);
    conditions.push(`p.estado = $${values.length}`);
  }

  if (filters.idClase) {
    values.push(filters.idClase);
    conditions.push(`p.id_clase = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query<ProgramacionRecord>(
    `
      SELECT ${SELECT_FIELDS}
      ${FROM_CLAUSE}
      ${whereClause}
      ORDER BY p.fecha ASC, p.hora_inicio ASC
    `,
    values,
  );

  return result.rows;
}

export async function findProgramacionById(
  idProgramacion: number,
): Promise<ProgramacionRecord | null> {
  const result = await pool.query<ProgramacionRecord>(
    `
      SELECT ${SELECT_FIELDS}
      ${FROM_CLAUSE}
      WHERE p.id_programacion = $1
      LIMIT 1
    `,
    [idProgramacion],
  );

  return result.rows[0] ?? null;
}

// Bloquea la fila de la programación dentro de una transacción, para
// serializar el conteo de reservas activas frente al cupo máximo y evitar
// condiciones de carrera (sobrecupo) cuando varias reservas llegan al mismo
// tiempo para la misma sesión.
export async function findProgramacionForUpdate(
  client: PoolClient,
  idProgramacion: number,
): Promise<{ id_programacion: number; cupo_maximo: number; estado: string } | null> {
  const result = await client.query<{
    id_programacion: number;
    cupo_maximo: number;
    estado: string;
  }>(
    `
      SELECT id_programacion, cupo_maximo, estado
      FROM programaciones_clase
      WHERE id_programacion = $1
      FOR UPDATE
    `,
    [idProgramacion],
  );

  return result.rows[0] ?? null;
}

export async function updateProgramacionById(data: {
  idProgramacion: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cupoMaximo: number;
}): Promise<ProgramacionRecord> {
  await pool.query(
    `
      UPDATE programaciones_clase
      SET
        fecha = $1,
        hora_inicio = $2,
        hora_fin = $3,
        cupo_maximo = $4,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_programacion = $5
    `,
    [
      data.fecha,
      data.horaInicio,
      data.horaFin,
      data.cupoMaximo,
      data.idProgramacion,
    ],
  );

  const updated = await findProgramacionById(data.idProgramacion);

  return updated as ProgramacionRecord;
}

export async function cancelProgramacionById(
  idProgramacion: number,
): Promise<ProgramacionRecord> {
  await pool.query(
    `
      UPDATE programaciones_clase
      SET
        estado = 'CANCELADA',
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_programacion = $1
    `,
    [idProgramacion],
  );

  const cancelled = await findProgramacionById(idProgramacion);

  return cancelled as ProgramacionRecord;
}
