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
