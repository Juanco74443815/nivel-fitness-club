import {
  findMembresiasEnPeriodo,
  findPagosEnPeriodo,
  findReservasEnPeriodo,
  findSociosEnPeriodo,
} from "../repositories/reporte.repository.js";
import type { GenerarReporteQuery } from "../validators/reporte.validator.js";

export interface ReporteResultado {
  tipo: string;
  desde: string;
  hasta: string;
  datos: unknown[];
  resumen: Record<string, number>;
}

export async function generarReporte(
  query: GenerarReporteQuery,
): Promise<ReporteResultado> {
  switch (query.tipo) {
    case "socios": {
      const datos = await findSociosEnPeriodo(query.desde, query.hasta);

      return {
        tipo: query.tipo,
        desde: query.desde,
        hasta: query.hasta,
        datos,
        resumen: {
          total_socios: datos.length,
          activos: datos.filter((s) => s.estado === "ACTIVO").length,
        },
      };
    }

    case "reservas": {
      const datos = await findReservasEnPeriodo(query.desde, query.hasta);

      return {
        tipo: query.tipo,
        desde: query.desde,
        hasta: query.hasta,
        datos,
        resumen: {
          total_reservas: datos.length,
          activas: datos.filter((r) => r.estado === "ACTIVA").length,
          canceladas: datos.filter((r) => r.estado === "CANCELADA").length,
        },
      };
    }

    case "membresias": {
      const datos = await findMembresiasEnPeriodo(query.desde, query.hasta);

      return {
        tipo: query.tipo,
        desde: query.desde,
        hasta: query.hasta,
        datos,
        resumen: {
          total_membresias: datos.length,
          activas: datos.filter((m) => m.estado === "ACTIVA").length,
        },
      };
    }

    case "pagos": {
      const datos = await findPagosEnPeriodo(query.desde, query.hasta);
      const ingresosTotales = datos
        .filter((p) => p.estado === "VERIFICADO")
        .reduce((suma, p) => suma + Number(p.monto), 0);

      return {
        tipo: query.tipo,
        desde: query.desde,
        hasta: query.hasta,
        datos,
        resumen: {
          total_pagos: datos.length,
          ingresos_totales: ingresosTotales,
        },
      };
    }
  }
}
