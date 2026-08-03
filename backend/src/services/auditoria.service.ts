import {
  findRegistrosAuditoria,
  insertRegistroAuditoria,
  type AuditoriaRecord,
} from "../repositories/auditoria.repository.js";

// No lanza: un fallo al escribir la auditoria no debe impedir que la accion
// original (cambio de rol, anulacion de pago) se complete.
export async function registrarAuditoria(data: {
  idUsuario: number;
  accion: string;
  entidadAfectada: string;
  idRegistroAfectado: number | null;
  detalle?: string | null;
}): Promise<void> {
  try {
    await insertRegistroAuditoria({
      idUsuario: data.idUsuario,
      accion: data.accion,
      entidadAfectada: data.entidadAfectada,
      idRegistroAfectado: data.idRegistroAfectado,
      detalle: data.detalle ?? null,
    });
  } catch (error) {
    console.error("Error al registrar la auditoria:", error);
  }
}

export async function consultarAuditoria(filters: {
  idUsuario?: number;
  desde?: string;
  hasta?: string;
}): Promise<AuditoriaRecord[]> {
  return findRegistrosAuditoria(filters);
}
