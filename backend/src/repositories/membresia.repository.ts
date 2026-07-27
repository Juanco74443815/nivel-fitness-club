import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface MembresiaRecord extends QueryResultRow {
  id_membresia: number;
  id_socio: number;
  socio_nombres: string;
  socio_apellidos: string;
  codigo_socio: string;
  id_plan: number;
  plan_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  motivo_anulacion: string | null;
  proxima_a_vencer: boolean;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

const SELECT_FIELDS = `
  m.id_membresia,
  m.id_socio,
  s.nombres AS socio_nombres,
  s.apellidos AS socio_apellidos,
  s.codigo_socio,
  m.id_plan,
  p.nombre AS plan_nombre,
  m.fecha_inicio,
  m.fecha_fin,
  m.estado,
  m.motivo_anulacion,
  (m.estado = 'ACTIVA' AND m.fecha_fin - CURRENT_DATE BETWEEN 0 AND 5) AS proxima_a_vencer,
  m.fecha_creacion,
  m.fecha_actualizacion
`;

const FROM_CLAUSE = `
  FROM membresias m
  INNER JOIN socios s ON s.id_socio = m.id_socio
  INNER JOIN planes_membresia p ON p.id_plan = m.id_plan
`;

export async function createMembresia(data: {
  idSocio: number;
  idPlan: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}): Promise<MembresiaRecord> {
  const insertResult = await pool.query<{ id_membresia: number }>(
    `
      INSERT INTO membresias (id_socio, id_plan, fecha_inicio, fecha_fin, estado)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_membresia
    `,
    [data.idSocio, data.idPlan, data.fechaInicio, data.fechaFin, data.estado],
  );

  const created = await findMembresiaById(insertResult.rows[0].id_membresia);

  return created as MembresiaRecord;
}

export async function findAllMembresias(filters: {
  idSocio?: number;
  estados?: string[];
}): Promise<MembresiaRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.idSocio) {
    values.push(filters.idSocio);
    conditions.push(`m.id_socio = $${values.length}`);
  }

  if (filters.estados && filters.estados.length > 0) {
    values.push(filters.estados);
    conditions.push(`m.estado = ANY($${values.length})`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query<MembresiaRecord>(
    `
      SELECT ${SELECT_FIELDS}
      ${FROM_CLAUSE}
      ${whereClause}
      ORDER BY m.fecha_creacion DESC
    `,
    values,
  );

  return result.rows;
}

export async function findMembresiaById(
  idMembresia: number,
): Promise<MembresiaRecord | null> {
  const result = await pool.query<MembresiaRecord>(
    `
      SELECT ${SELECT_FIELDS}
      ${FROM_CLAUSE}
      WHERE m.id_membresia = $1
      LIMIT 1
    `,
    [idMembresia],
  );

  return result.rows[0] ?? null;
}

export async function renovarMembresiaById(data: {
  idMembresia: number;
  fechaFin: string;
  estado: string;
}): Promise<MembresiaRecord> {
  await pool.query(
    `
      UPDATE membresias
      SET
        fecha_fin = $1,
        estado = $2,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_membresia = $3
    `,
    [data.fechaFin, data.estado, data.idMembresia],
  );

  const updated = await findMembresiaById(data.idMembresia);

  return updated as MembresiaRecord;
}

export async function cambiarEstadoMembresiaById(data: {
  idMembresia: number;
  estado: string;
  motivoAnulacion: string | null;
}): Promise<MembresiaRecord> {
  await pool.query(
    `
      UPDATE membresias
      SET
        estado = $1,
        motivo_anulacion = $2,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_membresia = $3
    `,
    [data.estado, data.motivoAnulacion, data.idMembresia],
  );

  const updated = await findMembresiaById(data.idMembresia);

  return updated as MembresiaRecord;
}
