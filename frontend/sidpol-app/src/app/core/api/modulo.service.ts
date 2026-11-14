import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Modulo, ModuloPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class ModuloService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/modulos`;

  /** Admin: todos. User: solo los que contienen submódulos accesibles (lo filtra el backend). */
  listar(): Observable<Modulo[]> {
    return this.http.get<Modulo[]>(this.url);
  }

  crear(datos: ModuloPayload): Observable<Modulo> {
    return this.http.post<Modulo>(this.url, datos);
  }

  editar(id: number, datos: ModuloPayload): Observable<Modulo> {
    return this.http.put<Modulo>(`${this.url}/${id}`, datos);
  }
}
