import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface ReporteSocioRow extends QueryResultRow {
  id_socio: number;
  codigo_socio: string;
  nombres: string;
  apellidos: string;
  estado: string;
  fecha_inscripcion: string;
}

export async function findSociosEnPeriodo(
  desde: string,
  hasta: string,
): Promise<ReporteSocioRow[]> {
  const result = await pool.query<ReporteSocioRow>(
    `
      SELECT id_socio, codigo_socio, nombres, apellidos, estado, fecha_inscripcion
      FROM socios
      WHERE fecha_inscripcion BETWEEN $1 AND $2
      ORDER BY fecha_inscripcion DESC
    `,
    [desde, hasta],
  );

  return result.rows;
}

export interface ReporteReservaRow extends QueryResultRow {
  id_reserva: number;
  socio_nombres: string;
  socio_apellidos: string;
  clase_nombre: string;
  fecha: string;
  estado: string;
}

export async function findReservasEnPeriodo(
  desde: string,
  hasta: string,
): Promise<ReporteReservaRow[]> {
  const result = await pool.query<ReporteReservaRow>(
    `
      SELECT
        r.id_reserva,
        s.nombres AS socio_nombres,
        s.apellidos AS socio_apellidos,
        c.nombre AS clase_nombre,
        p.fecha,
        r.estado
      FROM reservas r
      INNER JOIN socios s ON s.id_socio = r.id_socio
      INNER JOIN programaciones_clase p ON p.id_programacion = r.id_programacion
      INNER JOIN clases c ON c.id_clase = p.id_clase
      WHERE p.fecha BETWEEN $1 AND $2
      ORDER BY p.fecha DESC
    `,
    [desde, hasta],
  );

  return result.rows;
}

export interface ReporteMembresiaRow extends QueryResultRow {
  id_membresia: number;
  socio_nombres: string;
  socio_apellidos: string;
  plan_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

export async function findMembresiasEnPeriodo(
  desde: string,
  hasta: string,
): Promise<ReporteMembresiaRow[]> {
  const result = await pool.query<ReporteMembresiaRow>(
    `
      SELECT
        m.id_membresia,
        s.nombres AS socio_nombres,
        s.apellidos AS socio_apellidos,
        p.nombre AS plan_nombre,
        m.fecha_inicio,
        m.fecha_fin,
        m.estado
      FROM membresias m
      INNER JOIN socios s ON s.id_socio = m.id_socio
      INNER JOIN planes_membresia p ON p.id_plan = m.id_plan
      WHERE m.fecha_inicio BETWEEN $1 AND $2
      ORDER BY m.fecha_inicio DESC
    `,
    [desde, hasta],
  );

  return result.rows;
}

export interface ReportePagoRow extends QueryResultRow {
  id_pago: number;
  socio_nombres: string;
  socio_apellidos: string;
  monto: string;
  metodo_pago: string;
  estado: string;
  fecha_pago: Date;
}

export async function findPagosEnPeriodo(
  desde: string,
  hasta: string,
): Promise<ReportePagoRow[]> {
  const result = await pool.query<ReportePagoRow>(
    `
      SELECT
        pg.id_pago,
        s.nombres AS socio_nombres,
        s.apellidos AS socio_apellidos,
        pg.monto,
        pg.metodo_pago,
        pg.estado,
        pg.fecha_pago
      FROM pagos pg
      INNER JOIN socios s ON s.id_socio = pg.id_socio
      WHERE pg.fecha_pago::date BETWEEN $1 AND $2
      ORDER BY pg.fecha_pago DESC
    `,
    [desde, hasta],
  );

  return result.rows;
}
