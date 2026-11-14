import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificacionService } from '../notificaciones/notificacion.service';
import { API, iniciarSesion, proveedoresHttp } from '../../testing/helpers';
import { contextoSilencioso } from './contexto';
import { MENSAJES_ERROR } from './error.interceptor';

describe('interceptores HTTP', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let notificaciones: NotificacionService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    iniciarSesion();
    TestBed.configureTestingModule({ providers: proveedoresHttp() });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    notificaciones = TestBed.inject(NotificacionService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  const fallar = (url: string, status: number, cuerpo: object = {}, opciones = {}) => {
    http.get(url, opciones).subscribe({ error: () => undefined });
    backend.expectOne(url).flush(cuerpo, { status, statusText: 'x' });
  };

  describe('authInterceptor', () => {
    it('agrega el token SOLO a peticiones de la API', () => {
      http.get(`${API}/modulos`).subscribe();
      http.get('https://otro-servidor.com/datos').subscribe();
      expect(backend.expectOne(`${API}/modulos`).request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
      expect(backend.expectOne('https://otro-servidor.com/datos').request.headers.has('Authorization')).toBe(false);
    });

    it('sin sesión no agrega el header', () => {
      localStorage.clear();
      http.get(`${API}/modulos`).subscribe();
      expect(backend.expectOne(`${API}/modulos`).request.headers.has('Authorization')).toBe(false);
    });
  });

  describe('errorInterceptor', () => {
    it('401 → cierra la sesión, vuelve al login y avisa', () => {
      fallar(`${API}/modulos`, 401);
      expect(localStorage.getItem('token')).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      expect(notificaciones.lista().map((n) => n.mensaje)).toEqual([MENSAJES_ERROR.sesion]);
    });

    it('401 cierra la sesión aunque la petición sea silenciosa (sin toasts de otros errores)', () => {
      fallar(`${API}/submodulos/7/dashboards`, 401, {}, { context: contextoSilencioso() });
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('401 del propio login NO cierra sesión ni muestra toast (lo maneja el formulario)', () => {
      http.post(`${API}/auth/login`, {}, { context: contextoSilencioso() }).subscribe({ error: () => undefined });
      backend.expectOne(`${API}/auth/login`).flush({}, { status: 401, statusText: 'x' });
      expect(localStorage.getItem('token')).toBe('token-de-prueba');
      expect(notificaciones.lista()).toEqual([]);
    });

    it.each([
      [403, {}, MENSAJES_ERROR.permisos],
      [429, { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' }, 'Demasiados intentos. Intenta de nuevo en unos minutos.'],
      [500, { error: 'Error interno' }, MENSAJES_ERROR.interno],
      [0, {}, MENSAJES_ERROR.conexion]
    ])('%i → toast', (status, cuerpo, mensaje) => {
      fallar(`${API}/dashboards`, status, cuerpo);
      expect(notificaciones.lista().map((n) => n.mensaje)).toEqual([mensaje]);
      expect(localStorage.getItem('token')).toBe('token-de-prueba');
    });

    it('400 y 404 no muestran toast (los maneja cada formulario)', () => {
      fallar(`${API}/modulos`, 400, { errors: [] });
      fallar(`${API}/modulos`, 404);
      expect(notificaciones.lista()).toEqual([]);
    });

    it('petición silenciosa (visor) → sin toast en 403', () => {
      fallar(`${API}/submodulos/7/dashboards`, 403, {}, { context: contextoSilencioso() });
      expect(notificaciones.lista()).toEqual([]);
    });

    it('el error se relanza para que el componente también lo vea', () => {
      let status = -1;
      http.get(`${API}/dashboards`).subscribe({ error: (e) => (status = e.status) });
      backend.expectOne(`${API}/dashboards`).flush({}, { status: 403, statusText: 'x' });
      expect(status).toBe(403);
    });
  });
});
