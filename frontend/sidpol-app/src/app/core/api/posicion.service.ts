import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Posicion } from '../models';

@Injectable({ providedIn: 'root' })
export class PosicionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/posiciones`;

  listar(): Observable<Posicion[]> {
    return this.http.get<Posicion[]>(this.url);
  }
}
