import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface PagoRecord extends QueryResultRow {
  id_pago: number;
  id_socio: number;
  socio_nombres: string;
  socio_apellidos: string;
  codigo_socio: string;
  id_membresia: number | null;
  plan_nombre: string | null;
  monto: string;
  metodo_pago: string;
  comprobante_url: string | null;
  estado: string;
  fecha_pago: Date;
  observaciones: string | null;
  verificado_por: number | null;
  verificador_nombres: string | null;
  verificador_apellidos: string | null;
  fecha_actualizacion: Date;
}

const SELECT_FIELDS = `
  pg.id_pago,
  pg.id_socio,
  s.nombres AS socio_nombres,
  s.apellidos AS socio_apellidos,
  s.codigo_socio,
  pg.id_membresia,
  p.nombre AS plan_nombre,
  pg.monto,
  pg.metodo_pago,
  pg.comprobante_url,
  pg.estado,
  pg.fecha_pago,
  pg.observaciones,
  pg.verificado_por,
  u.nombres AS verificador_nombres,
  u.apellidos AS verificador_apellidos,
  pg.fecha_actualizacion
`;

const FROM_CLAUSE = `
  FROM pagos pg
  INNER JOIN socios s ON s.id_socio = pg.id_socio
  LEFT JOIN membresias m ON m.id_membresia = pg.id_membresia
  LEFT JOIN planes_membresia p ON p.id_plan = m.id_plan
  LEFT JOIN usuarios u ON u.id_usuario = pg.verificado_por
`;

export async function createPago(data: {
  idSocio: number;
  idMembresia: number | null;
  monto: number;
  metodoPago: string;
  estado: string;
  verificadoPor: number | null;
}): Promise<PagoRecord> {
  const insertResult = await pool.query<{ id_pago: number }>(
    `
      INSERT INTO pagos (id_socio, id_membresia, monto, metodo_pago, estado, verificado_por)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id_pago
    `,
    [
      data.idSocio,
      data.idMembresia,
      data.monto,
      data.metodoPago,
      data.estado,
      data.verificadoPor,
    ],
  );

  const created = await findPagoById(insertResult.rows[0].id_pago);

  return created as PagoRecord;
}

export async function findPagoById(idPago: number): Promise<PagoRecord | null> {
  const result = await pool.query<PagoRecord>(
    `
      SELECT ${SELECT_FIELDS}
      ${FROM_CLAUSE}
      WHERE pg.id_pago = $1
      LIMIT 1
    `,
    [idPago],
  );

  return result.rows[0] ?? null;
}

export async function findAllPagos(filters: {
  estado?: string;
  idSocio?: number;
}): Promise<PagoRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.estado) {
    values.push(filters.estado);
    conditions.push(`pg.estado = $${values.length}`);
  }

  if (filters.idSocio) {
    values.push(filters.idSocio);
    conditions.push(`pg.id_socio = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query<PagoRecord>(
    `
      SELECT ${SELECT_FIELDS}
      ${FROM_CLAUSE}
      ${whereClause}
      ORDER BY pg.fecha_pago DESC
    `,
    values,
  );

  return result.rows;
}

export async function findPagosBySocio(idSocio: number): Promise<PagoRecord[]> {
  const result = await pool.query<PagoRecord>(
    `
      SELECT ${SELECT_FIELDS}
      ${FROM_CLAUSE}
      WHERE pg.id_socio = $1
      ORDER BY pg.fecha_pago DESC
    `,
    [idSocio],
  );

  return result.rows;
}

export async function updateComprobantePago(
  idPago: number,
  comprobanteUrl: string,
): Promise<PagoRecord> {
  await pool.query(
    `
      UPDATE pagos
      SET
        comprobante_url = $1,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_pago = $2
    `,
    [comprobanteUrl, idPago],
  );

  const updated = await findPagoById(idPago);

  return updated as PagoRecord;
}

export async function updateEstadoPago(data: {
  idPago: number;
  estado: string;
  observaciones: string | null;
  verificadoPor: number;
}): Promise<PagoRecord> {
  await pool.query(
    `
      UPDATE pagos
      SET
        estado = $1,
        observaciones = $2,
        verificado_por = $3,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_pago = $4
    `,
    [data.estado, data.observaciones, data.verificadoPor, data.idPago],
  );

  const updated = await findPagoById(data.idPago);

  return updated as PagoRecord;
}
