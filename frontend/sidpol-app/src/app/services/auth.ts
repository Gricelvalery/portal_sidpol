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

  getUsuario() {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
  }

  getToken() {
    return localStorage.getItem('token');
  }

  // Solo controla qué se muestra; la autorización real la hace el backend
  // (checkRole / checkPermission).
  esAdmin(): boolean {
    const u = this.getUsuario();
    return String(u?.rol_u || '').toLowerCase() === 'admin';
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
