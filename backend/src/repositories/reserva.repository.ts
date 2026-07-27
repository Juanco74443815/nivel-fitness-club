import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface ReservaRecord extends QueryResultRow {
  id_reserva: number;
  id_socio: number;
  id_programacion: number;
  fecha_reserva: Date;
  estado: string;
  fecha_actualizacion: Date;
}

export interface SocioParaReserva extends QueryResultRow {
  id_socio: number;
  estado: string;
}

export async function findSocioByUsuarioId(
  idUsuario: number,
): Promise<SocioParaReserva | null> {
  const result = await pool.query<SocioParaReserva>(
    `
      SELECT id_socio, estado
      FROM socios
      WHERE id_usuario = $1
      LIMIT 1
    `,
    [idUsuario],
  );

  return result.rows[0] ?? null;
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function findActiveReservaForUpdate(
  client: PoolClient,
  idSocio: number,
  idProgramacion: number,
): Promise<{ id_reserva: number } | null> {
  const result = await client.query<{ id_reserva: number }>(
    `
      SELECT id_reserva
      FROM reservas
      WHERE id_socio = $1
        AND id_programacion = $2
        AND estado = 'ACTIVA'
      LIMIT 1
    `,
    [idSocio, idProgramacion],
  );

  return result.rows[0] ?? null;
}

export async function countActiveReservasForUpdate(
  client: PoolClient,
  idProgramacion: number,
): Promise<number> {
  const result = await client.query<{ total: string }>(
    `
      SELECT COUNT(*)::text AS total
      FROM reservas
      WHERE id_programacion = $1
        AND estado = 'ACTIVA'
    `,
    [idProgramacion],
  );

  return Number(result.rows[0]?.total ?? 0);
}

export async function insertReserva(
  client: PoolClient,
  idSocio: number,
  idProgramacion: number,
): Promise<ReservaRecord> {
  const result = await client.query<ReservaRecord>(
    `
      INSERT INTO reservas (id_socio, id_programacion)
      VALUES ($1, $2)
      RETURNING
        id_reserva,
        id_socio,
        id_programacion,
        fecha_reserva,
        estado,
        fecha_actualizacion
    `,
    [idSocio, idProgramacion],
  );

  return result.rows[0];
}

export interface ReservaListadoRecord extends QueryResultRow {
  id_reserva: number;
  id_programacion: number;
  id_clase: number;
  clase_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  fecha_reserva: Date;
  estado: string;
  fecha_actualizacion: Date;
}

export async function findReservasBySocio(
  idSocio: number,
): Promise<ReservaListadoRecord[]> {
  const result = await pool.query<ReservaListadoRecord>(
    `
      SELECT
        r.id_reserva,
        r.id_programacion,
        c.id_clase,
        c.nombre AS clase_nombre,
        p.fecha,
        p.hora_inicio,
        p.hora_fin,
        r.fecha_reserva,
        r.estado,
        r.fecha_actualizacion
      FROM reservas r
      INNER JOIN programaciones_clase p ON p.id_programacion = r.id_programacion
      INNER JOIN clases c ON c.id_clase = p.id_clase
      WHERE r.id_socio = $1
      ORDER BY p.fecha DESC, p.hora_inicio DESC
    `,
    [idSocio],
  );

  return result.rows;
}

export async function findReservaForUpdate(
  client: PoolClient,
  idReserva: number,
  idSocio: number,
): Promise<{ id_reserva: number; estado: string } | null> {
  const result = await client.query<{ id_reserva: number; estado: string }>(
    `
      SELECT id_reserva, estado
      FROM reservas
      WHERE id_reserva = $1
        AND id_socio = $2
      FOR UPDATE
    `,
    [idReserva, idSocio],
  );

  return result.rows[0] ?? null;
}

export async function cancelReservaById(
  client: PoolClient,
  idReserva: number,
): Promise<ReservaRecord> {
  const result = await client.query<ReservaRecord>(
    `
      UPDATE reservas
      SET
        estado = 'CANCELADA',
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_reserva = $1
      RETURNING
        id_reserva,
        id_socio,
        id_programacion,
        fecha_reserva,
        estado,
        fecha_actualizacion
    `,
    [idReserva],
  );

  return result.rows[0];
}
