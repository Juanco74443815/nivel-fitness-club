import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export function createUploadMiddleware(options: {
  subfolder: string;
  allowedMimeTypes: string[];
  maxSizeBytes: number;
}) {
  const destino = path.join(UPLOADS_ROOT, options.subfolder);
  fs.mkdirSync(destino, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_request, _file, callback) => callback(null, destino),
    filename: (_request, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
      callback(null, nombreUnico);
    },
  });

  return multer({
    storage,
    limits: { fileSize: options.maxSizeBytes },
    fileFilter: (_request, file, callback) => {
      if (!options.allowedMimeTypes.includes(file.mimetype)) {
        callback(new UploadError("El formato del archivo no es válido"));
        return;
      }

      callback(null, true);
    },
  });
}

export function publicUrlFor(subfolder: string, filename: string): string {
  return `/uploads/${subfolder}/${filename}`;
}

export const uploadComprobante = createUploadMiddleware({
  subfolder: "comprobantes",
  allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
  maxSizeBytes: 5 * 1024 * 1024,
});

export const uploadFotoAlimento = createUploadMiddleware({
  subfolder: "alimentos",
  allowedMimeTypes: ["image/jpeg", "image/png"],
  maxSizeBytes: 5 * 1024 * 1024,
});
