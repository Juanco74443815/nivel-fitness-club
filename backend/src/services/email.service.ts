import "dotenv/config";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;

  if (!host) {
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });

    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
  });

  return cachedTransporter;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const transporter = getTransporter();
  const from = process.env.SMTP_FROM ?? "no-reply@nivelfitnessclub.local";

  await transporter.sendMail({
    from,
    to,
    subject: "Recuperación de contraseña - Nivel Fitness Club",
    text: `Para restablecer tu contraseña visita el siguiente enlace: ${resetUrl}\n\nSi no solicitaste este cambio, ignora este mensaje.`,
    html: `<p>Para restablecer tu contraseña visita el siguiente enlace:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si no solicitaste este cambio, ignora este mensaje.</p>`,
  });
}
