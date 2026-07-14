import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { testDatabaseConnection } from "./config/database.js";
import { roleRouter } from "./routes/role.routes.js";
import { authRouter } from "./routes/auth.routes.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/roles", roleRouter);

app.use("/api/auth", authRouter);

app.get("/", (_request, response) => {
  response.status(200).json({
    message: "Bienvenido a la API de Nivel Fitness Club",
  });
});

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    message: "API de Nivel Fitness Club funcionando",
  });
});

app.get("/api/health/database", async (_request, response) => {
  try {
    const database = await testDatabaseConnection();

    response.status(200).json({
      status: "ok",
      message: "Conexión con PostgreSQL funcionando",
      database,
    });
  } catch (error) {
    console.error(error);

    response.status(500).json({
      status: "error",
      message: "No se pudo conectar con PostgreSQL",
    });
  }
});