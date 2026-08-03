import {
  countMembresiasVigentes,
  countReservasHoy,
  countSociosActivos,
  sumIngresosMes,
} from "../repositories/indicador.repository.js";

export interface Indicadores {
  socios_activos: number;
  membresias_vigentes: number;
  reservas_hoy: number;
  ingresos_mes: number;
}

export async function obtenerIndicadores(): Promise<Indicadores> {
  const [sociosActivos, membresiasVigentes, reservasHoy, ingresosMes] =
    await Promise.all([
      countSociosActivos(),
      countMembresiasVigentes(),
      countReservasHoy(),
      sumIngresosMes(),
    ]);

  return {
    socios_activos: sociosActivos,
    membresias_vigentes: membresiasVigentes,
    reservas_hoy: reservasHoy,
    ingresos_mes: ingresosMes,
  };
}
