import type { QueryResultRow } from "pg";
import { pool } from "../config/database.js";

export interface SocioRecord extends QueryResultRow {
  id_socio: number;
  id_usuario: number | null;
  codigo_socio: string;
  nombres: string;
  apellidos: string;
  ci: string | null;
  telefono: string | null;
  correo: string | null;
  fecha_nacimiento: string | null;
  fecha_inscripcion: string;
  estado: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

// Clave arbitraria y fija para serializar la generación de codigo_socio
// entre transacciones concurrentes, sin depender de una secuencia dedicada
// en el esquema (evita condiciones de carrera sin modificar la BD).
const CODIGO_SOCIO_LOCK_KEY = 841200501;

export async function findUserByIdForLink(
  idUsuario: number,
): Promise<{ id_usuario: number } | null> {
  const result = await pool.query<{ id_usuario: number }>(
    `
      SELECT id_usuario
      FROM usuarios
      WHERE id_usuario = $1
      LIMIT 1
    `,
    [idUsuario],
  );

  return result.rows[0] ?? null;
}

export async function findSocioByUsuarioId(
  idUsuario: number,
): Promise<{ id_socio: number } | null> {
  const result = await pool.query<{ id_socio: number }>(
    `
      SELECT id_socio
      FROM socios
      WHERE id_usuario = $1
      LIMIT 1
    `,
    [idUsuario],
  );

  return result.rows[0] ?? null;
}

export async function findSocioByCiForValidation(
  ci: string,
): Promise<{ id_socio: number } | null> {
  const result = await pool.query<{ id_socio: number }>(
    `
      SELECT id_socio
      FROM socios
      WHERE ci = $1
      LIMIT 1
    `,
    [ci],
  );

  return result.rows[0] ?? null;
}

export async function findSocioByCorreoForValidation(
  correo: string,
): Promise<{ id_socio: number } | null> {
  const result = await pool.query<{ id_socio: number }>(
    `
      SELECT id_socio
      FROM socios
      WHERE LOWER(correo) = LOWER($1)
      LIMIT 1
    `,
    [correo],
  );

  return result.rows[0] ?? null;
}

export async function findSocioByCiExcludingId(
  ci: string,
  idSocio: number,
): Promise<{ id_socio: number } | null> {
  const result = await pool.query<{ id_socio: number }>(
    `
      SELECT id_socio
      FROM socios
      WHERE ci = $1
        AND id_socio <> $2
      LIMIT 1
    `,
    [ci, idSocio],
  );

  return result.rows[0] ?? null;
}

export async function findSocioByCorreoExcludingId(
  correo: string,
  idSocio: number,
): Promise<{ id_socio: number } | null> {
  const result = await pool.query<{ id_socio: number }>(
    `
      SELECT id_socio
      FROM socios
      WHERE LOWER(correo) = LOWER($1)
        AND id_socio <> $2
      LIMIT 1
    `,
    [correo, idSocio],
  );

  return result.rows[0] ?? null;
}

export async function createSocio(data: {
  idUsuario: number | null;
  nombres: string;
  apellidos: string;
  ci: string | null;
  telefono: string | null;
  correo: string | null;
  fechaNacimiento: string | null;
}): Promise<SocioRecord> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("SELECT pg_advisory_xact_lock($1)", [
      CODIGO_SOCIO_LOCK_KEY,
    ]);

    const nextNumberResult = await client.query<{ next_num: string }>(
      "SELECT COALESCE(MAX(id_socio), 0) + 1 AS next_num FROM socios",
    );

    const nextNumber = Number(nextNumberResult.rows[0].next_num);
    const codigoSocio = `SOC-${String(nextNumber).padStart(6, "0")}`;

    const insertResult = await client.query<SocioRecord>(
      `
        INSERT INTO socios (
          id_usuario,
          codigo_socio,
          nombres,
          apellidos,
          ci,
          telefono,
          correo,
          fecha_nacimiento
        )
        VALUES ($1, $2, $3, $4, $5, $6, LOWER($7), $8)
        RETURNING
          id_socio,
          id_usuario,
          codigo_socio,
          nombres,
          apellidos,
          ci,
          telefono,
          correo,
          fecha_nacimiento,
          fecha_inscripcion,
          estado,
          fecha_creacion,
          fecha_actualizacion
      `,
      [
        data.idUsuario,
        codigoSocio,
        data.nombres,
        data.apellidos,
        data.ci,
        data.telefono,
        data.correo,
        data.fechaNacimiento,
      ],
    );

    await client.query("COMMIT");

    return insertResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findAllSocios(filters: {
  estado?: string;
  busqueda?: string;
}): Promise<SocioRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.estado) {
    values.push(filters.estado);
    conditions.push(`estado = $${values.length}`);
  }

  if (filters.busqueda) {
    values.push(`%${filters.busqueda.toLowerCase()}%`);
    const placeholder = `$${values.length}`;
    conditions.push(
      `(
        LOWER(nombres) LIKE ${placeholder}
        OR LOWER(apellidos) LIKE ${placeholder}
        OR LOWER(COALESCE(ci, '')) LIKE ${placeholder}
        OR LOWER(codigo_socio) LIKE ${placeholder}
      )`,
    );
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const result = await pool.query<SocioRecord>(
    `
      SELECT
        id_socio,
        id_usuario,
        codigo_socio,
        nombres,
        apellidos,
        ci,
        telefono,
        correo,
        fecha_nacimiento,
        fecha_inscripcion,
        estado,
        fecha_creacion,
        fecha_actualizacion
      FROM socios
      ${whereClause}
      ORDER BY id_socio DESC
    `,
    values,
  );

  return result.rows;
}

export async function findSocioById(
  idSocio: number,
): Promise<SocioRecord | null> {
  const result = await pool.query<SocioRecord>(
    `
      SELECT
        id_socio,
        id_usuario,
        codigo_socio,
        nombres,
        apellidos,
        ci,
        telefono,
        correo,
        fecha_nacimiento,
        fecha_inscripcion,
        estado,
        fecha_creacion,
        fecha_actualizacion
      FROM socios
      WHERE id_socio = $1
      LIMIT 1
    `,
    [idSocio],
  );

  return result.rows[0] ?? null;
}

export async function updateSocioById(data: {
  idSocio: number;
  nombres: string;
  apellidos: string;
  ci: string | null;
  telefono: string | null;
  correo: string | null;
  fechaNacimiento: string | null;
}): Promise<SocioRecord> {
  const result = await pool.query<SocioRecord>(
    `
      UPDATE socios
      SET
        nombres = $1,
        apellidos = $2,
        ci = $3,
        telefono = $4,
        correo = LOWER($5),
        fecha_nacimiento = $6,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_socio = $7
      RETURNING
        id_socio,
        id_usuario,
        codigo_socio,
        nombres,
        apellidos,
        ci,
        telefono,
        correo,
        fecha_nacimiento,
        fecha_inscripcion,
        estado,
        fecha_creacion,
        fecha_actualizacion
    `,
    [
      data.nombres,
      data.apellidos,
      data.ci,
      data.telefono,
      data.correo,
      data.fechaNacimiento,
      data.idSocio,
    ],
  );

  return result.rows[0];
}

export async function deactivateSocioById(
  idSocio: number,
): Promise<SocioRecord> {
  const result = await pool.query<SocioRecord>(
    `
      UPDATE socios
      SET
        estado = 'INACTIVO',
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_socio = $1
      RETURNING
        id_socio,
        id_usuario,
        codigo_socio,
        nombres,
        apellidos,
        ci,
        telefono,
        correo,
        fecha_nacimiento,
        fecha_inscripcion,
        estado,
        fecha_creacion,
        fecha_actualizacion
    `,
    [idSocio],
  );

  return result.rows[0];
}
