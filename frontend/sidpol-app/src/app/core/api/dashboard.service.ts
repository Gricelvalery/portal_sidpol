import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dashboard, DashboardPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/dashboards`;

  /** Admin: todos. User: solo los permitidos (lo filtra el backend). */
  listar(): Observable<Dashboard[]> {
    return this.http.get<Dashboard[]>(this.url);
  }

  crear(datos: DashboardPayload): Observable<Dashboard> {
    return this.http.post<Dashboard>(this.url, datos);
  }

  editar(id: number, datos: DashboardPayload): Observable<Dashboard> {
    return this.http.put<Dashboard>(`${this.url}/${id}`, datos);
  }
}
