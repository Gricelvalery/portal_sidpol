import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '../core/interceptors/auth.interceptor';
import { errorInterceptor } from '../core/interceptors/error.interceptor';
import { Usuario } from '../core/models';
import { environment } from '../../environments/environment';

export const API = environment.apiUrl;

/** HttpClient con los interceptores reales + backend simulado (HttpTestingController). */
export function proveedoresHttp(): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter([]),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideHttpClientTesting()
  ];
}

export function usuarioDePrueba(campos: Partial<Usuario> = {}): Usuario {
  return {
    id_u: 1, nombres_u: 'Gricel', apellido_paterno_u: 'Mucha', apellido_materno_u: 'Diaz',
    username: 'gricel.mucha', correo_u: 'gricel.mucha@sidpol.pe', rol_u: 'admin', autorizado: true,
    id_posicion: 1, nombre_posicion: 'Analista', nombre_area: 'DIRTIC', ...campos
  };
}

/** Simula una sesión iniciada (lo que AuthService lee de localStorage al crearse). */
export function iniciarSesion(usuario: Usuario = usuarioDePrueba()): void {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('usuario', JSON.stringify(usuario));
}
