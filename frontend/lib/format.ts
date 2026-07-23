export function formatFecha(fecha: string): string {
  return fecha.slice(0, 10);
}

export function formatHora(hora: string): string {
  return hora.slice(0, 5);
}
