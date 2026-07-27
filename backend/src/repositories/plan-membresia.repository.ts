import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface PlanMembresiaRecord extends QueryResultRow {
  id_plan: number;
  nombre: string;
  descripcion: string | null;
  duracion_dias: number;
  precio: string;
  estado: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

const SELECT_FIELDS = `
  id_plan,
  nombre,
  descripcion,
  duracion_dias,
  precio,
  estado,
  fecha_creacion,
  fecha_actualizacion
`;

export async function createPlan(data: {
  nombre: string;
  descripcion: string | null;
  duracionDias: number;
  precio: number;
}): Promise<PlanMembresiaRecord> {
  const result = await pool.query<PlanMembresiaRecord>(
    `
      INSERT INTO planes_membresia (nombre, descripcion, duracion_dias, precio)
      VALUES ($1, $2, $3, $4)
      RETURNING ${SELECT_FIELDS}
    `,
    [data.nombre, data.descripcion, data.duracionDias, data.precio],
  );

  return result.rows[0];
}

export async function findAllPlanes(filters: {
  estado?: string;
}): Promise<PlanMembresiaRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.estado) {
    values.push(filters.estado);
    conditions.push(`estado = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query<PlanMembresiaRecord>(
    `
      SELECT ${SELECT_FIELDS}
      FROM planes_membresia
      ${whereClause}
      ORDER BY id_plan DESC
    `,
    values,
  );

  return result.rows;
}

export async function findPlanById(
  idPlan: number,
): Promise<PlanMembresiaRecord | null> {
  const result = await pool.query<PlanMembresiaRecord>(
    `
      SELECT ${SELECT_FIELDS}
      FROM planes_membresia
      WHERE id_plan = $1
      LIMIT 1
    `,
    [idPlan],
  );

  return result.rows[0] ?? null;
}

export async function findActivePlanById(
  idPlan: number,
): Promise<{ id_plan: number; duracion_dias: number } | null> {
  const result = await pool.query<{ id_plan: number; duracion_dias: number }>(
    `
      SELECT id_plan, duracion_dias
      FROM planes_membresia
      WHERE id_plan = $1
        AND estado = 'ACTIVO'
      LIMIT 1
    `,
    [idPlan],
  );

  return result.rows[0] ?? null;
}

export async function updatePlanById(data: {
  idPlan: number;
  nombre: string;
  descripcion: string | null;
  duracionDias: number;
  precio: number;
}): Promise<PlanMembresiaRecord> {
  const result = await pool.query<PlanMembresiaRecord>(
    `
      UPDATE planes_membresia
      SET
        nombre = $1,
        descripcion = $2,
        duracion_dias = $3,
        precio = $4,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_plan = $5
      RETURNING ${SELECT_FIELDS}
    `,
    [data.nombre, data.descripcion, data.duracionDias, data.precio, data.idPlan],
  );

  return result.rows[0];
}

export async function deactivatePlanById(
  idPlan: number,
): Promise<PlanMembresiaRecord> {
  const result = await pool.query<PlanMembresiaRecord>(
    `
      UPDATE planes_membresia
      SET
        estado = 'INACTIVO',
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_plan = $1
      RETURNING ${SELECT_FIELDS}
    `,
    [idPlan],
  );

  return result.rows[0];
}
