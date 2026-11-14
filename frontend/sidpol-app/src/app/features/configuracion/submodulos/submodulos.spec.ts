import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Submodulos } from './submodulos';
import { API, iniciarSesion, proveedoresHttp } from '../../../testing/helpers';

describe('Submodulos', () => {
  afterEach(() => localStorage.clear());

  it('carga submódulos y módulos con una sola espera (forkJoin) y llena la tabla', async () => {
    iniciarSesion();
    TestBed.configureTestingModule({ imports: [Submodulos], providers: proveedoresHttp() });
    const backend = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Submodulos);
    await fixture.whenStable();

    backend.expectOne(`${API}/submodulos`).flush([
      { id_sm: 6, nombre_sm: 'Tendencias', descripcion_sm: 'Delitos', modulos_id_m: 3, nombre_m: 'Ánalisis', ruta: 'visor/6' }
    ]);
    const el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
    expect(el.querySelector('.cargando')).not.toBeNull(); // aún falta /modulos

    backend.expectOne(`${API}/modulos`).flush([]);
    await fixture.whenStable();
    const celdas = [...el.querySelectorAll('tbody td')].map((td) => td.textContent?.trim());
    expect(celdas).toEqual(['Tendencias', 'Delitos', 'Ánalisis', '']);
  });
});
