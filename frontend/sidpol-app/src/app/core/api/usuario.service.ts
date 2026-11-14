import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PermisosAsignados,
  Usuario,
  UsuarioCrearPayload,
  UsuarioEditarPayload,
  UsuarioGuardadoResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  /** El backend genera username y correo, y fuerza el rol 'user'. */
  crear(datos: UsuarioCrearPayload): Observable<UsuarioGuardadoResponse> {
    return this.http.post<UsuarioGuardadoResponse>(this.url, datos);
  }

  editar(id: number, datos: UsuarioEditarPayload): Observable<UsuarioGuardadoResponse> {
    return this.http.put<UsuarioGuardadoResponse>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.url}/${id}`);
  }

  permisos(id: number): Observable<PermisosAsignados> {
    return this.http.get<PermisosAsignados>(`${this.url}/${id}/permisos`);
  }

  guardarPermisos(id: number, permisos: PermisosAsignados): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.url}/${id}/permisos`, permisos);
  }
}
