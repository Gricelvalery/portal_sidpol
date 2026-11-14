import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Inicio } from './inicio';
import { API, iniciarSesion, proveedoresHttp, usuarioDePrueba } from '../../testing/helpers';

describe('Inicio', () => {
  const montar = async (rol: 'admin' | 'user') => {
    iniciarSesion(usuarioDePrueba({ rol_u: rol }));
    TestBed.configureTestingModule({ imports: [Inicio], providers: proveedoresHttp() });
    const fixture = TestBed.createComponent(Inicio);
    await fixture.whenStable();
    return { fixture, backend: TestBed.inject(HttpTestingController) };
  };

  afterEach(() => localStorage.clear());

  it('user sin accesos → "Aún no tienes accesos asignados"', async () => {
    const { fixture, backend } = await montar('user');
    backend.expectOne(`${API}/submodulos`).flush([]);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Aún no tienes accesos asignados. Contacta al administrador.',
    );
  });

  it('user con accesos → sin aviso', async () => {
    const { fixture, backend } = await montar('user');
    backend
      .expectOne(`${API}/submodulos`)
      .flush([
        { id_sm: 6, nombre_sm: 'T', descripcion_sm: null, modulos_id_m: 3, ruta: 'visor/6' },
      ]);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-sin-accesos')).toBeNull();
  });

  it('admin → no consulta permisos', async () => {
    const { backend } = await montar('admin');
    backend.expectNone(`${API}/submodulos`);
  });
});
