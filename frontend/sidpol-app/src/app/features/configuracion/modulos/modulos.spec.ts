import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Modulos } from './modulos';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import { API, iniciarSesion, proveedoresHttp } from '../../../testing/helpers';

describe('Modulos (pantalla CRUD)', () => {
  let backend: HttpTestingController;

  const montar = async () => {
    iniciarSesion();
    TestBed.configureTestingModule({ imports: [Modulos], providers: proveedoresHttp() });
    backend = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Modulos);
    await fixture.whenStable();
    backend.expectOne(`${API}/modulos`).flush([
      {
        id_m: 1,
        nombre_m: 'Configuración',
        descripcion_m: 'Admin',
        id_area: 1,
        nombre_area: 'DIRTIC',
      },
      {
        id_m: 3,
        nombre_m: 'Ánalisis Temporal',
        descripcion_m: 'Tendencias',
        id_area: null,
        nombre_area: null,
      },
    ]);
    backend
      .expectOne(`${API}/area`)
      .flush([{ id_area: 1, nombre_area: 'DIRTIC', descripcion_area: null }]);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };

  const filas = (el: HTMLElement) =>
    [...el.querySelectorAll('tbody tr')].map((tr) =>
      [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim()),
    );

  afterEach(() => localStorage.clear());

  it('carga módulos y áreas en paralelo y llena la tabla', async () => {
    const { el } = await montar();
    expect(filas(el)).toEqual([
      ['Configuración', 'Admin', 'DIRTIC', ''],
      ['Ánalisis Temporal', 'Tendencias', '—', ''],
    ]);
  });

  it('el buscador filtra por nombre o descripción', async () => {
    const { fixture, el } = await montar();
    const input = el.querySelector<HTMLInputElement>('.buscador')!;
    input.value = 'tenden';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(filas(el).map((f) => f[0])).toEqual(['Ánalisis Temporal']);
  });

  it('valida campos vacíos sin llamar a la API', async () => {
    const { fixture, el } = await montar();
    el.querySelector<HTMLButtonElement>('.btn-agregar')!.click();
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('.btn-guardar')!.click();
    await fixture.whenStable();
    expect([...el.querySelectorAll('.mensaje-error')].map((e) => e.textContent?.trim())).toEqual([
      'El nombre es requerido',
      'La descripción es requerida',
      'Selecciona un área',
    ]);
    backend.expectNone({ method: 'POST' });
  });

  it('muestra los errores 400 del backend junto a cada campo', async () => {
    const { fixture, el } = await montar();
    fixture.componentInstance['abrirEditar']({
      id_m: 1,
      nombre_m: 'X',
      descripcion_m: 'Y',
      id_area: 1,
    });
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('.btn-guardar')!.click();
    backend
      .expectOne(`${API}/modulos/1`)
      .flush(
        { errors: [{ path: 'nombre_m', msg: 'Máximo 100 caracteres' }] },
        { status: 400, statusText: 'x' },
      );
    await fixture.whenStable();
    expect(el.querySelector('.mensaje-error')?.textContent).toContain('Máximo 100 caracteres');
  });

  it('al guardar: cierra el modal, recarga y muestra el toast', async () => {
    const { fixture, el } = await montar();
    fixture.componentInstance['abrirEditar']({
      id_m: 1,
      nombre_m: 'X',
      descripcion_m: 'Y',
      id_area: 1,
    });
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('.btn-guardar')!.click();
    backend.expectOne(`${API}/modulos/1`).flush({});
    backend.expectOne(`${API}/modulos`).flush([]);
    backend.expectOne(`${API}/area`).flush([]);
    await fixture.whenStable();
    expect(el.querySelector('app-modal')).toBeNull();
    expect(
      TestBed.inject(NotificacionService)
        .lista()
        .map((n) => n.mensaje),
    ).toEqual(['Modulo actualizado correctamente']);
  });
});
