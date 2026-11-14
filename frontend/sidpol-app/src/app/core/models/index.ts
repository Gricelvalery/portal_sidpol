// Contrato con la API REST del backend: estas interfaces reflejan exactamente el JSON que devuelve.

export type Rol = 'admin' | 'user';

export interface Usuario {
  id_u: number;
  nombres_u: string;
  apellido_paterno_u: string;
  apellido_materno_u: string | null;
  username: string;
  correo_u: string;
  rol_u: Rol;
  autorizado: boolean;
  id_posicion: number | null;
  nombre_posicion?: string | null;
  nombre_area?: string | null;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  usuario: Usuario;
}

export interface Area {
  id_area: number;
  nombre_area: string;
  descripcion_area: string | null;
}

export interface Posicion {
  id_posicion: number;
  nombre_posicion: string;
  descripcion_p: string | null;
  id_area: number;
  nombre_area?: string | null;
}

export interface Modulo {
  id_m: number;
  nombre_m: string;
  descripcion_m: string;
  id_area: number | null;
  nombre_area?: string | null;
}

export interface Submodulo {
  id_sm: number;
  nombre_sm: string;
  descripcion_sm: string | null;
  modulos_id_m: number;
  nombre_m?: string | null;
  ruta: string | null;
}

export interface PaginaDashboard {
  nombre: string;
  seccion?: string | null;
}

export interface Dashboard {
  id_d: number;
  nombre_d: string;
  link_d: string;
  submodulos_id_sm: number;
  paginas: PaginaDashboard[] | null;
  nombre_sm?: string | null;
  nombre_m?: string | null;
}

export interface PermisosAsignados {
  submodulos_ids: number[];
  dashboards_ids: number[];
}

// ----- Cuerpos que se envían -----

export interface AreaPayload {
  nombre_area: string;
  descripcion_area: string;
}

export interface ModuloPayload {
  nombre_m: string;
  descripcion_m: string;
  id_area: number | null;
}

export interface SubmoduloPayload {
  nombre_sm: string;
  descripcion_sm: string;
  modulos_id_m: number | null;
}

export interface DashboardPayload {
  nombre_d: string;
  link_d: string;
  submodulos_id_sm: number | null;
  paginas?: PaginaDashboard[];
}

export interface UsuarioCrearPayload {
  nombres_u: string;
  apellido_paterno_u: string;
  apellido_materno_u: string;
  contrasenia_u: string;
  id_posicion: number | null;
  autorizado: boolean;
}

export interface UsuarioEditarPayload {
  nombres_u: string;
  apellido_paterno_u: string;
  apellido_materno_u: string;
  rol_u: Rol;
  id_posicion: number | null;
  autorizado: boolean;
}

export interface UsuarioGuardadoResponse {
  success: boolean;
  usuario: Usuario;
}

// ----- Errores -----

export interface ErrorValidacion {
  path: string;
  msg: string;
}

export interface ErrorApi {
  error?: string;
  errors?: ErrorValidacion[];
}
