import { TestBed } from '@angular/core/testing';
import { NotificacionService } from './notificacion.service';

describe('NotificacionService', () => {
  let servicio: NotificacionService;

  beforeEach(() => {
    vi.useFakeTimers();
    servicio = TestBed.inject(NotificacionService);
  });

  afterEach(() => vi.useRealTimers());

  it('muestra y oculta el toast a los 3 segundos', () => {
    servicio.exito('Guardado');
    expect(servicio.lista()).toEqual([expect.objectContaining({ mensaje: 'Guardado', tipo: 'exito' })]);
    vi.advanceTimersByTime(2999);
    expect(servicio.lista()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(servicio.lista()).toHaveLength(0);
  });

  it('no repite el mismo mensaje mientras está visible (varios 401 seguidos)', () => {
    servicio.error('Tu sesión expiró');
    servicio.error('Tu sesión expiró');
    servicio.exito('Otro aviso');
    expect(servicio.lista().map((n) => n.mensaje)).toEqual(['Tu sesión expiró', 'Otro aviso']);
  });

  it('cerrar() lo quita y cancela su temporizador', () => {
    servicio.exito('A');
    servicio.cerrar(servicio.lista()[0].id);
    expect(servicio.lista()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('al destruirse limpia los temporizadores pendientes (DestroyRef)', () => {
    servicio.exito('A');
    servicio.error('B');
    expect(vi.getTimerCount()).toBe(2);
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });
});
