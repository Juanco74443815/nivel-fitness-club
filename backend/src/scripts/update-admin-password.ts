import "dotenv/config";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../config/database.js";

const environmentSchema = z.object({
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
});

async function updateAdministratorPassword(): Promise<void> {
  const environment = environmentSchema.parse(process.env);

  const passwordHash = await bcrypt.hash(
    environment.ADMIN_PASSWORD,
    12,
  );

  const result = await pool.query<{
    id_usuario: number;
    correo: string;
  }>(
    `
      UPDATE usuarios
      SET
        password_hash = $1,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE LOWER(correo) = LOWER($2)
      RETURNING id_usuario, correo
    `,
    [
      passwordHash,
      environment.ADMIN_EMAIL,
    ],
  );

  const administrator = result.rows[0];

  if (!administrator) {
    throw new Error(
      "No se encontró el usuario administrador registrado.",
    );
  }

  console.log("Contraseña del administrador actualizada correctamente.");
  console.log(`Correo: ${administrator.correo}`);
}

updateAdministratorPassword()
  .catch((error: unknown) => {
    console.error("No se pudo actualizar la contraseña.");

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });