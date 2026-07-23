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
