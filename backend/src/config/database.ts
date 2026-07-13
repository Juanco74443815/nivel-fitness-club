import "dotenv/config";
import { Pool } from "pg";

const databasePort = Number(process.env.DATABASE_PORT ?? 5432);

export const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: databasePort,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
  console.error("Error inesperado en PostgreSQL:", error);
});

export async function testDatabaseConnection() {
  const result = await pool.query(`
    SELECT
      current_database() AS base_datos,
      current_user AS usuario,
      CURRENT_TIMESTAMP AS fecha_servidor
  `);

  return result.rows[0];
}