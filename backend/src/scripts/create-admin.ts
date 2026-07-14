import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../config/database.js";

const environmentSchema = z.object({
  ADMIN_NOMBRES: z.string().min(2),
  ADMIN_APELLIDOS: z.string().min(2),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
});

async function createAdministrator(): Promise<void> {
  const environment = environmentSchema.parse(process.env);

  const roleResult = await pool.query<{ id_rol: number }>(
    `
      SELECT id_rol
      FROM roles
      WHERE nombre = $1
        AND estado = 'ACTIVO'
      LIMIT 1
    `,
    ["Administrador"],
  );

  const administratorRole = roleResult.rows[0];

  if (!administratorRole) {
    throw new Error(
      "No se encontró el rol Administrador. Ejecuta primero el script de roles.",
    );
  }

  const existingUserResult = await pool.query<{ id_usuario: number }>(
    `
      SELECT id_usuario
      FROM usuarios
      WHERE LOWER(correo) = LOWER($1)
      LIMIT 1
    `,
    [environment.ADMIN_EMAIL],
  );

  if (existingUserResult.rows[0]) {
    console.log("El usuario administrador ya existe.");
    return;
  }

  const passwordHash = await bcrypt.hash(
    environment.ADMIN_PASSWORD,
    12,
  );

  const result = await pool.query<{
    id_usuario: number;
    correo: string;
  }>(
    `
      INSERT INTO usuarios (
        id_rol,
        nombres,
        apellidos,
        correo,
        password_hash
      )
      VALUES ($1, $2, $3, LOWER($4), $5)
      RETURNING id_usuario, correo
    `,
    [
      administratorRole.id_rol,
      environment.ADMIN_NOMBRES,
      environment.ADMIN_APELLIDOS,
      environment.ADMIN_EMAIL,
      passwordHash,
    ],
  );

  const administrator = result.rows[0];

  console.log("Administrador creado correctamente.");
  console.log(`ID: ${administrator.id_usuario}`);
  console.log(`Correo: ${administrator.correo}`);
}

createAdministrator()
  .catch((error: unknown) => {
    console.error("No se pudo crear el administrador.");

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });