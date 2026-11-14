import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { contextoSilencioso } from '../interceptors/contexto';
import { LoginResponse, Usuario } from '../models';

const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

function leerUsuarioGuardado(): Usuario | null {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIO) ?? 'null') as Usuario | null;
  } catch {
    return null;
  }
}

/**
 * Sesión del usuario. Guarda token y usuario en localStorage y expone el estado
 * como signals. Solo decide qué se MUESTRA: la autorización real la hace el backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _usuario = signal<Usuario | null>(leerUsuarioGuardado());
  readonly usuario = this._usuario.asReadonly();
  readonly esAdmin = computed(() => String(this._usuario()?.rol_u ?? '').toLowerCase() === 'admin');

  /** Los errores del login los muestra el formulario, no un toast. */
  login(username: string, contrasenia: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { username, contrasenia }, { context: contextoSilencioso() })
      .pipe(tap((resp) => this.guardarSesion(resp)));
  }

  getToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  estaLogueado(): boolean {
    return !!this.getToken();
  }

  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_USUARIO);
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem('permisos'); // clave de versiones anteriores
    this._usuario.set(null);
    this.router.navigate(['/login']);
  }

  private guardarSesion({ token, usuario }: LoginResponse): void {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this._usuario.set(usuario);
  }
}
