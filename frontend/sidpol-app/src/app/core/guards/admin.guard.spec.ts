import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { iniciarSesion, proveedoresHttp, usuarioDePrueba } from '../../testing/helpers';

describe('adminGuard', () => {
  const ejecutar = () =>
    TestBed.runInInjectionContext(() => adminGuard({ path: 'configuracion' }, []));

  afterEach(() => localStorage.clear());

  it('admin → puede entrar a configuración', () => {
    iniciarSesion(usuarioDePrueba({ rol_u: 'admin' }));
    TestBed.configureTestingModule({ providers: proveedoresHttp() });
    expect(ejecutar()).toBe(true);
  });

  it('user → lo redirige a /inicio', () => {
    iniciarSesion(usuarioDePrueba({ rol_u: 'user' }));
    TestBed.configureTestingModule({ providers: proveedoresHttp() });
    const resultado = ejecutar() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(resultado)).toBe('/inicio');
  });

  it('sin sesión → lo redirige a /inicio (y authGuard lo manda al login)', () => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: proveedoresHttp() });
    expect(ejecutar()).toBeInstanceOf(UrlTree);
  });
});
