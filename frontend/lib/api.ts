const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiEnvelope<T> {
  status: "ok" | "error";
  message: string;
  data?: T;
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !body || body.status !== "ok") {
    throw new ApiError(
      response.status,
      body?.message ?? "No se pudo completar la solicitud",
    );
  }

  return body.data as T;
}

// Igual que `request`, pero para endpoints que responden solo con `message`
// (sin `data`), como forgot-password/reset-password.
async function requestMessage(
  path: string,
  options: RequestInit = {},
): Promise<string> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json" },
  });

  const body = (await response.json().catch(() => null)) as ApiEnvelope<never> | null;

  if (!response.ok || !body || body.status !== "ok") {
    throw new ApiError(
      response.status,
      body?.message ?? "No se pudo completar la solicitud",
    );
  }

  return body.message;
}

export interface Usuario {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  id_rol: number;
  rol: string;
}

export interface LoginResult {
  token: string;
  usuario: Usuario;
}

export function login(correo: string, password: string): Promise<LoginResult> {
  return request<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ correo, password }),
  });
}

export function logout(token: string): Promise<void> {
  return request<void>("/api/auth/logout", {
    method: "POST",
    token,
  });
}

export function forgotPassword(correo: string): Promise<string> {
  return requestMessage("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ correo }),
  });
}

export function resetPassword(token: string, password: string): Promise<string> {
  return requestMessage("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export interface Perfil {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  ci: string | null;
  telefono: string | null;
  correo: string;
  estado: string;
  fecha_creacion: string;
  ultimo_acceso: string | null;
  id_rol: number;
  rol: string;
}

export function getPerfil(token: string): Promise<Perfil> {
  return request<Perfil>("/api/auth/profile", { token });
}

export interface UsuarioListado {
  id_usuario: number;
  id_rol: number;
  nombres: string;
  apellidos: string;
  ci: string | null;
  telefono: string | null;
  correo: string;
  estado: string;
  fecha_creacion: string;
  ultimo_acceso: string | null;
  rol: string;
}

export function listUsuarios(token: string): Promise<UsuarioListado[]> {
  return request<UsuarioListado[]>("/api/users", { token });
}

export function cambiarRolUsuario(
  token: string,
  idUsuario: number,
  idRol: number,
): Promise<UsuarioListado> {
  return request<UsuarioListado>(`/api/users/${idUsuario}/role`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ id_rol: idRol }),
  });
}

export function desactivarUsuario(
  token: string,
  idUsuario: number,
): Promise<UsuarioListado> {
  return request<UsuarioListado>(`/api/users/${idUsuario}/deactivate`, {
    method: "PATCH",
    token,
  });
}

export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
  estado: string;
}

export function listRoles(token: string): Promise<Rol[]> {
  return request<Rol[]>("/api/roles", { token });
}

export interface SocioListado {
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
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export function listSocios(
  token: string,
  filtros: { estado?: string; q?: string } = {},
): Promise<SocioListado[]> {
  const params = new URLSearchParams();
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.q) params.set("q", filtros.q);
  const query = params.toString();

  return request<SocioListado[]>(`/api/socios${query ? `?${query}` : ""}`, {
    token,
  });
}

export interface CrearSocioInput {
  nombres: string;
  apellidos: string;
  ci?: string | null;
  telefono?: string | null;
  correo?: string | null;
  fecha_nacimiento?: string | null;
}

export function crearSocio(
  token: string,
  input: CrearSocioInput,
): Promise<SocioListado> {
  return request<SocioListado>("/api/socios", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function actualizarSocio(
  token: string,
  idSocio: number,
  input: Partial<CrearSocioInput>,
): Promise<SocioListado> {
  return request<SocioListado>(`/api/socios/${idSocio}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  });
}

export function desactivarSocio(
  token: string,
  idSocio: number,
): Promise<SocioListado> {
  return request<SocioListado>(`/api/socios/${idSocio}/deactivate`, {
    method: "PATCH",
    token,
  });
}

export interface Clase {
  id_clase: number;
  nombre: string;
  descripcion: string | null;
  instructor: string | null;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export function listClases(
  token: string,
  filtros: { estado?: string; q?: string } = {},
): Promise<Clase[]> {
  const params = new URLSearchParams();
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.q) params.set("q", filtros.q);
  const query = params.toString();

  return request<Clase[]>(`/api/clases${query ? `?${query}` : ""}`, {
    token,
  });
}

export interface CrearClaseInput {
  nombre: string;
  descripcion?: string | null;
  instructor?: string | null;
}

export function crearClase(
  token: string,
  input: CrearClaseInput,
): Promise<Clase> {
  return request<Clase>("/api/clases", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function actualizarClase(
  token: string,
  idClase: number,
  input: Partial<CrearClaseInput>,
): Promise<Clase> {
  return request<Clase>(`/api/clases/${idClase}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  });
}

export function desactivarClase(
  token: string,
  idClase: number,
): Promise<Clase> {
  return request<Clase>(`/api/clases/${idClase}/deactivate`, {
    method: "PATCH",
    token,
  });
}

export interface ProgramacionClase {
  id_programacion: number;
  id_clase: number;
  clase_nombre: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cupo_maximo: number;
  reservas_activas: number;
  cupos_disponibles: number;
  estado: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export function listProgramaciones(
  token: string,
  filtros: { estado?: string; id_clase?: number } = {},
): Promise<ProgramacionClase[]> {
  const params = new URLSearchParams();
  if (filtros.estado) params.set("estado", filtros.estado);
  if (filtros.id_clase) params.set("id_clase", String(filtros.id_clase));
  const query = params.toString();

  return request<ProgramacionClase[]>(
    `/api/programaciones${query ? `?${query}` : ""}`,
    { token },
  );
}

export interface CrearProgramacionInput {
  id_clase: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cupo_maximo: number;
}

export function crearProgramacion(
  token: string,
  input: CrearProgramacionInput,
): Promise<ProgramacionClase> {
  return request<ProgramacionClase>("/api/programaciones", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function actualizarProgramacion(
  token: string,
  idProgramacion: number,
  input: Partial<CrearProgramacionInput>,
): Promise<ProgramacionClase> {
  return request<ProgramacionClase>(`/api/programaciones/${idProgramacion}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  });
}

export function cancelarProgramacion(
  token: string,
  idProgramacion: number,
): Promise<ProgramacionClase> {
  return request<ProgramacionClase>(
    `/api/programaciones/${idProgramacion}/cancel`,
    { method: "PATCH", token },
  );
}

export interface Reserva {
  id_reserva: number;
  id_socio: number;
  id_programacion: number;
  fecha_reserva: string;
  estado: string;
  fecha_actualizacion: string;
}

export function crearReserva(
  token: string,
  idProgramacion: number,
): Promise<Reserva> {
  return request<Reserva>("/api/reservas", {
    method: "POST",
    token,
    body: JSON.stringify({ id_programacion: idProgramacion }),
  });
}
