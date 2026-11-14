import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { contextoSilencioso } from '../interceptors/contexto';
import { Dashboard, Submodulo, SubmoduloPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class SubmoduloService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/submodulos`;

  /** Admin: todos. User: solo los accesibles (lo filtra el backend). */
  listar(): Observable<Submodulo[]> {
    return this.http.get<Submodulo[]>(this.url);
  }

  /**
   * Dashboards visibles de un submódulo. 403 si el usuario no tiene acceso:
   * se pide en modo silencioso porque el visor muestra su propio aviso.
   */
  dashboards(idSubmodulo: number): Observable<Dashboard[]> {
    return this.http.get<Dashboard[]>(`${this.url}/${idSubmodulo}/dashboards`, { context: contextoSilencioso() });
  }

  crear(datos: SubmoduloPayload): Observable<Submodulo> {
    return this.http.post<Submodulo>(this.url, datos);
  }

  editar(id: number, datos: SubmoduloPayload): Observable<Submodulo> {
    return this.http.put<Submodulo>(`${this.url}/${id}`, datos);
  }
}
