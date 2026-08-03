import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface ConsultaNutricionalRecord extends QueryResultRow {
  id_consulta: number;
  id_socio: number;
  imagen_url: string;
  alimentos_detectados: string;
  calorias_estimadas: string | null;
  proteinas_g: string | null;
  carbohidratos_g: string | null;
  grasas_g: string | null;
  estado: string;
  fecha_consulta: Date;
}

const SELECT_FIELDS = `
  id_consulta,
  id_socio,
  imagen_url,
  alimentos_detectados,
  calorias_estimadas,
  proteinas_g,
  carbohidratos_g,
  grasas_g,
  estado,
  fecha_consulta
`;

export async function createConsultaNutricional(data: {
  idSocio: number;
  imagenUrl: string;
  alimentosDetectados: string;
  caloriasEstimadas: number | null;
  proteinasG: number | null;
  carbohidratosG: number | null;
  grasasG: number | null;
  estado: string;
}): Promise<ConsultaNutricionalRecord> {
  const result = await pool.query<ConsultaNutricionalRecord>(
    `
      INSERT INTO consulta_nutricional (
        id_socio, imagen_url, alimentos_detectados, calorias_estimadas,
        proteinas_g, carbohidratos_g, grasas_g, estado
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${SELECT_FIELDS}
    `,
    [
      data.idSocio,
      data.imagenUrl,
      data.alimentosDetectados,
      data.caloriasEstimadas,
      data.proteinasG,
      data.carbohidratosG,
      data.grasasG,
      data.estado,
    ],
  );

  return result.rows[0];
}

export async function findConsultasBySocio(
  idSocio: number,
): Promise<ConsultaNutricionalRecord[]> {
  const result = await pool.query<ConsultaNutricionalRecord>(
    `
      SELECT ${SELECT_FIELDS}
      FROM consulta_nutricional
      WHERE id_socio = $1
      ORDER BY fecha_consulta DESC
    `,
    [idSocio],
  );

  return result.rows;
}
