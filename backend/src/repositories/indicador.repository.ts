import { pool } from "../config/database.js";

async function contarConQuery(sql: string, values: unknown[] = []): Promise<number> {
  const result = await pool.query<{ total: string }>(sql, values);
  return Number(result.rows[0]?.total ?? 0);
}

export async function countSociosActivos(): Promise<number> {
  return contarConQuery(
    `SELECT COUNT(*)::text AS total FROM socios WHERE estado = 'ACTIVO'`,
  );
}

export async function countMembresiasVigentes(): Promise<number> {
  return contarConQuery(
    `SELECT COUNT(*)::text AS total FROM membresias WHERE estado = 'ACTIVA'`,
  );
}

export async function countReservasHoy(): Promise<number> {
  return contarConQuery(
    `
      SELECT COUNT(*)::text AS total
      FROM reservas r
      INNER JOIN programaciones_clase p ON p.id_programacion = r.id_programacion
      WHERE p.fecha = CURRENT_DATE
        AND r.estado = 'ACTIVA'
    `,
  );
}

export async function sumIngresosMes(): Promise<number> {
  const result = await pool.query<{ total: string }>(
    `
      SELECT COALESCE(SUM(monto), 0)::text AS total
      FROM pagos
      WHERE estado = 'VERIFICADO'
        AND date_trunc('month', fecha_pago) = date_trunc('month', CURRENT_DATE)
    `,
  );

  return Number(result.rows[0]?.total ?? 0);
}
