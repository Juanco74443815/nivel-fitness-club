import "dotenv/config";
import { app } from "./app.js";
import { testDatabaseConnection } from "./config/database.js";

const port = Number(process.env.PORT ?? 3000);

async function startServer() {
  try {
    const database = await testDatabaseConnection();

    console.log(
      `PostgreSQL conectado: ${database.base_datos} con el usuario ${database.usuario}`,
    );

    app.listen(port, () => {
      console.log(`Servidor ejecutándose en http://localhost:${port}`);
    });
  } catch (error) {
    console.error("No se pudo conectar con PostgreSQL.");

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exit(1);
  }
}

void startServer();