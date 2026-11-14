import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SILENCIAR_ERRORES } from '../interceptors/contexto';
import { API, iniciarSesion, proveedoresHttp, usuarioDePrueba } from '../../testing/helpers';

describe('AuthService', () => {
  let auth: AuthService;
  let backend: HttpTestingController;

  const crear = () => {
    TestBed.configureTestingModule({ providers: proveedoresHttp() });
    auth = TestBed.inject(AuthService);
    backend = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  };

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('login guarda token y usuario, y actualiza las signals', () => {
    crear();
    const usuario = usuarioDePrueba({ rol_u: 'user' });
    auth.login('gricel.mucha', 'secreta').subscribe();

    const req = backend.expectOne(`${API}/auth/login`);
    expect(req.request.body).toEqual({ username: 'gricel.mucha', contrasenia: 'secreta' });
    expect(req.request.context.get(SILENCIAR_ERRORES)).toBe(true); // errores en el formulario, no en toast
    req.flush({ success: true, token: 'jwt-123', usuario });

    expect(localStorage.getItem('token')).toBe('jwt-123');
    expect(auth.usuario()).toEqual(usuario);
    expect(auth.estaLogueado()).toBe(true);
    expect(auth.esAdmin()).toBe(false);
  });

  it('esAdmin se calcula desde el usuario guardado (también con "Admin" de versiones viejas)', () => {
    iniciarSesion(usuarioDePrueba({ rol_u: 'Admin' as 'admin' }));
    crear();
    expect(auth.esAdmin()).toBe(true);
  });

  it('cerrarSesion borra todo y vuelve al login', () => {
    iniciarSesion();
    localStorage.setItem('permisos', '[]');
    crear();
    auth.cerrarSesion();
    expect(localStorage.length).toBe(0);
    expect(auth.usuario()).toBeNull();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
  });

  it('un usuario guardado corrupto no rompe la app', () => {
    localStorage.setItem('usuario', '{no es json');
    crear();
    expect(auth.usuario()).toBeNull();
  });
});
