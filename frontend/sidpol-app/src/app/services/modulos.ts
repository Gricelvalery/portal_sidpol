import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModulosService {
  private base = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  getModulos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/modulos`);
  }
  crearModulo(data: any): Observable<any> {
    return this.http.post(`${this.base}/modulos`, data);
  }
  editarModulo(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/modulos/${id}`, data);
  }

  getSubmodulos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/submodulos`);
  }
  crearSubmodulo(data: any): Observable<any> {
    return this.http.post(`${this.base}/submodulos`, data);
  }
  editarSubmodulo(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/submodulos/${id}`, data);
  }

  getAreas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/area`);
  }
  crearArea(data: any): Observable<any> {
    return this.http.post(`${this.base}/area`, data);
  }
  editarArea(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/area/${id}`, data);
  }

  getDashboards(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/dashboards`);
  }
  crearDashboard(data: any): Observable<any> {
    return this.http.post(`${this.base}/dashboards`, data);
  }
  editarDashboard(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/dashboards/${id}`, data);
  }

    getUsuarios(): Observable<any[]> {
  return this.http.get<any[]>(`${this.base}/usuario`);
}
crearUsuario(data: any): Observable<any> {
  return this.http.post(`${this.base}/usuario`, data);
}
editarUsuario(id: number, data: any): Observable<any> {
  return this.http.put(`${this.base}/usuario/${id}`, data);
}
eliminarUsuario(id: number): Observable<any> {
  return this.http.delete(`${this.base}/usuario/${id}`);
}
getPosiciones(): Observable<any[]> {
  return this.http.get<any[]>(`${this.base}/posicion`);
}
getPermisos(idUsuario: number): Observable<any[]> {
  return this.http.get<any[]>(`${this.base}/usuario/${idUsuario}/permisos`);
}
guardarPermisos(idUsuario: number, dashboards_ids: number[], submodulos_ids: number[]): Observable<any> {
  return this.http.post(`${this.base}/usuario/${idUsuario}/permisos`, { dashboards_ids, submodulos_ids });
}
    
}