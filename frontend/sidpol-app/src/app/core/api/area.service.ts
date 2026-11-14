import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Area, AreaPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class AreaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/areas`;

  listar(): Observable<Area[]> {
    return this.http.get<Area[]>(this.url);
  }

  crear(datos: AreaPayload): Observable<Area> {
    return this.http.post<Area>(this.url, datos);
  }

  editar(id: number, datos: AreaPayload): Observable<Area> {
    return this.http.put<Area>(`${this.url}/${id}`, datos);
  }
}
