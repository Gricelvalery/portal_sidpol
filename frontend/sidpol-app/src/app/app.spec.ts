import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { NotificacionService } from './core/notificaciones/notificacion.service';
import { proveedoresHttp } from './testing/helpers';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [App], providers: proveedoresHttp() });
  });

  it('tiene el router y el toast global', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).not.toBeNull();
    expect(el.querySelector('app-toast')).not.toBeNull();
  });

  it('muestra los toasts de NotificacionService con el diseño de notificación', async () => {
    const fixture = TestBed.createComponent(App);
    TestBed.inject(NotificacionService).error('Algo falló');
    await fixture.whenStable();
    const toast = (fixture.nativeElement as HTMLElement).querySelector('.notificacion');
    expect(toast?.textContent).toContain('Algo falló');
    expect(toast?.classList).toContain('notificacion-error');
  });
});
