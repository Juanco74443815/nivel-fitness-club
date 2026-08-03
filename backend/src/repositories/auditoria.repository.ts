import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface AuditoriaRecord extends QueryResultRow {
  id_auditoria: number;
  id_usuario: number;
  usuario_nombres: string;
  usuario_apellidos: string;
  accion: string;
  entidad_afectada: string;
  id_registro_afectado: number | null;
  fecha: Date;
  detalle: string | null;
}

export async function insertRegistroAuditoria(data: {
  idUsuario: number;
  accion: string;
  entidadAfectada: string;
  idRegistroAfectado: number | null;
  detalle: string | null;
}): Promise<void> {
  await pool.query(
    `
      INSERT INTO registro_auditoria (id_usuario, accion, entidad_afectada, id_registro_afectado, detalle)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      data.idUsuario,
      data.accion,
      data.entidadAfectada,
      data.idRegistroAfectado,
      data.detalle,
    ],
  );
}

export async function findRegistrosAuditoria(filters: {
  idUsuario?: number;
  desde?: string;
  hasta?: string;
}): Promise<AuditoriaRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.idUsuario) {
    values.push(filters.idUsuario);
    conditions.push(`a.id_usuario = $${values.length}`);
  }

  if (filters.desde) {
    values.push(filters.desde);
    conditions.push(`a.fecha >= $${values.length}`);
  }

  if (filters.hasta) {
    values.push(filters.hasta);
    conditions.push(`a.fecha < ($${values.length}::date + INTERVAL '1 day')`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query<AuditoriaRecord>(
    `
      SELECT
        a.id_auditoria,
        a.id_usuario,
        u.nombres AS usuario_nombres,
        u.apellidos AS usuario_apellidos,
        a.accion,
        a.entidad_afectada,
        a.id_registro_afectado,
        a.fecha,
        a.detalle
      FROM registro_auditoria a
      INNER JOIN usuarios u ON u.id_usuario = a.id_usuario
      ${whereClause}
      ORDER BY a.fecha DESC
    `,
    values,
  );

  return result.rows;
}
