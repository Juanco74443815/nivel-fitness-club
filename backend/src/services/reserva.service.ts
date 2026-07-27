import { findProgramacionForUpdate } from "../repositories/programacion.repository.js";
import {
  cancelReservaById,
  countActiveReservasForUpdate,
  findActiveReservaForUpdate,
  findReservaForUpdate,
  findReservasBySocio,
  findSocioByUsuarioId,
  getClient,
  insertReserva,
  type ReservaListadoRecord,
  type ReservaRecord,
} from "../repositories/reserva.repository.js";
import type { CreateReservaInput } from "../validators/reserva.validator.js";

export class ReservaError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ReservaError";
  }
}

export async function registerReserva(
  idUsuarioAutenticado: number,
  input: CreateReservaInput,
): Promise<ReservaRecord> {
  const socio = await findSocioByUsuarioId(idUsuarioAutenticado);

  if (!socio) {
    throw new ReservaError(
      403,
      "La cuenta autenticada no está vinculada a ningún socio",
    );
  }

  if (socio.estado !== "ACTIVO") {
    throw new ReservaError(403, "El socio se encuentra inactivo");
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const programacion = await findProgramacionForUpdate(
      client,
      input.id_programacion,
    );

    if (!programacion) {
      throw new ReservaError(
        404,
        "La sesión seleccionada no existe",
      );
    }

    if (programacion.estado !== "PROGRAMADA") {
      throw new ReservaError(
        409,
        "La sesión no está disponible para reservas",
      );
    }

    const reservaExistente = await findActiveReservaForUpdate(
      client,
      socio.id_socio,
      input.id_programacion,
    );

    if (reservaExistente) {
      throw new ReservaError(
        409,
        "El socio ya tiene una reserva activa para esta sesión",
      );
    }

    const reservasActivas = await countActiveReservasForUpdate(
      client,
      input.id_programacion,
    );

    if (reservasActivas >= programacion.cupo_maximo) {
      throw new ReservaError(
        409,
        "La sesión ha alcanzado su cupo máximo",
      );
    }

    const reserva = await insertReserva(
      client,
      socio.id_socio,
      input.id_programacion,
    );

    await client.query("COMMIT");

    return reserva;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listReservasSocio(
  idUsuarioAutenticado: number,
): Promise<ReservaListadoRecord[]> {
  const socio = await findSocioByUsuarioId(idUsuarioAutenticado);

  if (!socio) {
    throw new ReservaError(
      403,
      "La cuenta autenticada no está vinculada a ningún socio",
    );
  }

  return findReservasBySocio(socio.id_socio);
}

export async function cancelReserva(
  idUsuarioAutenticado: number,
  idReserva: number,
): Promise<ReservaRecord> {
  const socio = await findSocioByUsuarioId(idUsuarioAutenticado);

  if (!socio) {
    throw new ReservaError(
      403,
      "La cuenta autenticada no está vinculada a ningún socio",
    );
  }

  const client = await getClient();

  try {
    await client.query("BEGIN");

    const reserva = await findReservaForUpdate(client, idReserva, socio.id_socio);

    if (!reserva) {
      throw new ReservaError(404, "La reserva seleccionada no existe");
    }

    if (reserva.estado !== "ACTIVA") {
      throw new ReservaError(
        409,
        "Solo se puede cancelar una reserva con estado ACTIVA",
      );
    }

    const cancelada = await cancelReservaById(client, idReserva);

    await client.query("COMMIT");

    return cancelada;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
