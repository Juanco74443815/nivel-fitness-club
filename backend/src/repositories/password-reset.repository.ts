import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface ValidResetToken extends QueryResultRow {
  id_token: number;
  id_usuario: number;
}

export async function invalidateActiveTokensForUser(
  idUsuario: number,
): Promise<void> {
  await pool.query(
    `
      UPDATE tokens_recuperacion
      SET usado = TRUE,
          fecha_uso = CURRENT_TIMESTAMP
      WHERE id_usuario = $1
        AND usado = FALSE
        AND fecha_expiracion > CURRENT_TIMESTAMP
    `,
    [idUsuario],
  );
}

export async function createResetToken(data: {
  idUsuario: number;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await pool.query(
    `
      INSERT INTO tokens_recuperacion (
        id_usuario,
        token_hash,
        fecha_expiracion
      )
      VALUES ($1, $2, $3)
    `,
    [data.idUsuario, data.tokenHash, data.expiresAt],
  );
}

export async function findValidTokenByHash(
  tokenHash: string,
): Promise<ValidResetToken | null> {
  const result = await pool.query<ValidResetToken>(
    `
      SELECT id_token, id_usuario
      FROM tokens_recuperacion
      WHERE token_hash = $1
        AND usado = FALSE
        AND fecha_expiracion > CURRENT_TIMESTAMP
      LIMIT 1
    `,
    [tokenHash],
  );

  return result.rows[0] ?? null;
}

export async function applyPasswordResetTransaction(data: {
  idUsuario: number;
  idToken: number;
  passwordHash: string;
}): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE usuarios
        SET password_hash = $1,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_usuario = $2
      `,
      [data.passwordHash, data.idUsuario],
    );

    await client.query(
      `
        UPDATE tokens_recuperacion
        SET usado = TRUE,
            fecha_uso = CURRENT_TIMESTAMP
        WHERE id_token = $1
      `,
      [data.idToken],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
