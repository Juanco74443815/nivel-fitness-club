import path from "node:path";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { MulterError } from "multer";
import morgan from "morgan";
import { testDatabaseConnection } from "./config/database.js";
import { UploadError } from "./middlewares/upload.middleware.js";
import { roleRouter } from "./routes/role.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { socioRouter } from "./routes/socio.routes.js";
import { claseRouter } from "./routes/clase.routes.js";
import { programacionRouter } from "./routes/programacion.routes.js";
import { reservaRouter } from "./routes/reserva.routes.js";
import { planMembresiaRouter } from "./routes/plan-membresia.routes.js";
import { membresiaRouter } from "./routes/membresia.routes.js";
import { pagoRouter } from "./routes/pago.routes.js";
import { reporteRouter } from "./routes/reporte.routes.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/users", userRouter);
app.use("/api/roles", roleRouter);
app.use("/api/socios", socioRouter);
app.use("/api/clases", claseRouter);
app.use("/api/programaciones", programacionRouter);
app.use("/api/reservas", reservaRouter);
app.use("/api/planes-membresia", planMembresiaRouter);
app.use("/api/membresias", membresiaRouter);
app.use("/api/pagos", pagoRouter);
app.use("/api/reportes", reporteRouter);

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

// Manejador de errores no capturados por los controladores, en particular
// los generados por multer al validar archivos subidos (HDU-30, HDU-37).
app.use(
  (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof UploadError) {
      response.status(400).json({
        status: "error",
        message: error.message,
      });

      return;
    }

    if (error instanceof MulterError) {
      response.status(400).json({
        status: "error",
        message: "El archivo no es válido o excede el tamaño permitido",
      });

      return;
    }

    console.error("Error no controlado:", error);

    response.status(500).json({
      status: "error",
      message: "Ocurrió un error inesperado",
    });
  },
);