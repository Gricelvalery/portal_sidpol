import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, contrasenia: string) {
    return this.http.post(`${this.apiUrl}/auth/login`, { username, contrasenia });
  }

  guardarUsuario(usuario: any) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  guardarToken(token: string) {
    localStorage.setItem('token', token);
  }

  guardarPermisos(permisos: any[]) {
    localStorage.setItem('permisos', JSON.stringify(permisos));
  }

  getUsuario() {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getPermisos(): any[] {
    return JSON.parse(localStorage.getItem('permisos') || '[]');
  }

  esAdmin(): boolean {
    const u = this.getUsuario();
    return u?.rol === 'Admin';
  }

  tieneAccesoRuta(ruta: string): boolean {
    if (this.esAdmin()) return true;
    const permisos = this.getPermisos();
    return permisos.some(p => p.ruta === ruta);
  }

  tieneAccesoDashboard(id_d: number): boolean {
    if (this.esAdmin()) return true;
    const permisos = this.getPermisos();
    return permisos.some(p => p.dashboards_id_d === id_d);
  }

  estaLogueado() {
    return !!localStorage.getItem('token');
  }

  cerrarSesion() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('permisos');
    this.router.navigate(['/login']);
  }
}