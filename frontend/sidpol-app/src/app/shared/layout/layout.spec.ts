import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Layout } from './layout';
import { Modulo, Submodulo } from '../../core/models';
import { API, iniciarSesion, proveedoresHttp, usuarioDePrueba } from '../../testing/helpers';

const modulo = (id_m: number, nombre_m: string): Modulo => ({
  id_m,
  nombre_m,
  descripcion_m: '',
  id_area: null,
});
const sub = (
  id_sm: number,
  nombre_sm: string,
  modulos_id_m: number,
  ruta: string | null,
): Submodulo => ({ id_sm, nombre_sm, descripcion_sm: null, modulos_id_m, ruta });

describe('Layout (menú)', () => {
  const montar = async (rol: 'admin' | 'user') => {
    iniciarSesion(usuarioDePrueba({ rol_u: rol }));
    TestBed.configureTestingModule({ imports: [Layout], providers: proveedoresHttp() });
    const backend = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Layout);
    await fixture.whenStable();
    // forkJoin: las dos peticiones salen en paralelo
    backend
      .expectOne(`${API}/modulos`)
      .flush([modulo(3, 'Ánalisis'), modulo(1, 'Configuración'), modulo(8, 'Vacío')]);
    backend
      .expectOne(`${API}/submodulos`)
      .flush([
        sub(7, 'Mapa', 3, 'visor/7'),
        sub(6, 'Tendencias', 3, 'visor/6'),
        sub(4, 'Usuarios', 1, 'configuracion/usuarios'),
        sub(8, 'Lima', 3, null),
      ]);
    await fixture.whenStable();
    return { fixture, router, el: fixture.nativeElement as HTMLElement };
  };

  afterEach(() => localStorage.clear());

  it('ordena módulos y submódulos por nombre', async () => {
    const { el } = await montar('admin');
    const textos = [...el.querySelectorAll('.menu-folder span')].map((s) => s.textContent);
    expect(textos).toEqual(['ÁNALISIS', 'CONFIGURACIÓN', 'VACÍO']);
    const subs = [...el.querySelectorAll('.submenu')[0].querySelectorAll('span')].map(
      (s) => s.textContent,
    );
    expect(subs).toEqual(['LIMA', 'MAPA', 'TENDENCIAS']);
  });

  it('un user no ve módulos sin submódulos', async () => {
    const { el } = await montar('user');
    expect([...el.querySelectorAll('.menu-folder span')].map((s) => s.textContent)).toEqual([
      'ÁNALISIS',
      'CONFIGURACIÓN',
    ]);
  });

  it('navega con la ruta de la base y, si no tiene, al visor del submódulo', async () => {
    const { el, router } = await montar('admin');
    const items = [...el.querySelectorAll<HTMLLIElement>('.submenu li')];
    items.find((li) => li.textContent?.includes('TENDENCIAS'))!.click();
    expect(router.navigate).toHaveBeenLastCalledWith(['/visor/6']);
    items.find((li) => li.textContent?.includes('LIMA'))!.click();
    expect(router.navigate).toHaveBeenLastCalledWith(['/visor/8']);
    items.find((li) => li.textContent?.includes('USUARIOS'))!.click();
    expect(router.navigate).toHaveBeenLastCalledWith(['/configuracion/usuarios']);
  });

  it('abre y cierra un módulo del menú', async () => {
    const { fixture, el } = await montar('admin');
    const primero = el.querySelector<HTMLLIElement>('.sidebar-menu > li')!;
    primero.click();
    await fixture.whenStable();
    expect(el.querySelector('.submenu')?.classList).toContain('visible');
    primero.click();
    await fixture.whenStable();
    expect(el.querySelector('.submenu')?.classList).not.toContain('visible');
  });
});
