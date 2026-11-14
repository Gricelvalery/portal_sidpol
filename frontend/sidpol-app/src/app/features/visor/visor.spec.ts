import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Visor } from './visor';
import { Dashboard } from '../../core/models';
import { NotificacionService } from '../../core/notificaciones/notificacion.service';
import { API, iniciarSesion, proveedoresHttp } from '../../testing/helpers';

const dashboard = (campos: Partial<Dashboard> = {}): Dashboard => ({
  id_d: 1,
  nombre_d: 'Tendencias',
  link_d: 'https://app.powerbi.com/view?r=abc',
  submodulos_id_sm: 6,
  paginas: [],
  ...campos,
});

describe('Visor', () => {
  let backend: HttpTestingController;

  const montar = async (idSubmodulo = '6') => {
    iniciarSesion();
    TestBed.configureTestingModule({
      imports: [Visor],
      providers: [
        ...proveedoresHttp(),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: idSubmodulo })) },
        },
      ],
    });
    backend = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Visor);
    await fixture.whenStable();
    return fixture;
  };

  afterEach(() => localStorage.clear());

  it('iframe con sandbox, pantalla completa permitida y la URL de Power BI', async () => {
    const fixture = await montar();
    backend.expectOne(`${API}/submodulos/6/dashboards`).flush([dashboard()]);
    await fixture.whenStable();

    const iframe = (fixture.nativeElement as HTMLElement).querySelector('iframe')!;
    expect(iframe.getAttribute('src')).toBe('https://app.powerbi.com/view?r=abc');
    expect(iframe.getAttribute('sandbox')).toBe(
      'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms',
    );
    expect(iframe.getAttribute('allow')).toBe('fullscreen');
    expect(iframe.hasAttribute('allowfullscreen')).toBe(true);
    expect(iframe.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
  });

  it('un link fuera de la lista permitida NO se carga en el iframe', async () => {
    const fixture = await montar();
    backend
      .expectOne(`${API}/submodulos/6/dashboards`)
      .flush([dashboard({ link_d: 'https://evil.com/phishing' })]);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('iframe')).toBeNull();
    expect(el.textContent).toContain('no pertenece a un dominio permitido');
  });

  it('403 → aviso "sin accesos" y sin toast (petición silenciosa)', async () => {
    const fixture = await montar('7');
    backend
      .expectOne(`${API}/submodulos/7/dashboards`)
      .flush({ error: 'No tienes acceso' }, { status: 403, statusText: 'x' });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Aún no tienes accesos asignados',
    );
    expect(TestBed.inject(NotificacionService).lista()).toEqual([]);
  });
});
