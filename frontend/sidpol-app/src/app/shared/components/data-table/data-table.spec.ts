import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CeldaTabla, ColumnaTabla, DataTable } from './data-table';

interface Fila { id: number; nombre: string; area: string | null }

@Component({
  imports: [DataTable, CeldaTabla],
  template: `
    <app-data-table [columnas]="columnas" [filas]="filas()" [cargando]="cargando()"
      [(busqueda)]="busqueda" textoAgregar="Agregar Fila" (agregar)="agregadas = agregadas + 1">
      <ng-template appCelda="acciones" [appCeldaDe]="filas()" let-f>
        <button class="editar">editar {{ f.id }}</button>
      </ng-template>
    </app-data-table>`
})
class Anfitrion {
  columnas: ColumnaTabla<Fila>[] = [
    { titulo: 'Nombre', valor: (f) => f.nombre },
    { titulo: 'Área', valor: (f) => f.area, siVacio: '—' },
    { titulo: 'Acciones', celda: 'acciones', claseCelda: 'acciones' }
  ];
  filas = signal<Fila[]>([{ id: 1, nombre: 'Uno', area: 'A' }, { id: 2, nombre: 'Dos', area: null }]);
  cargando = signal(false);
  busqueda = signal('');
  agregadas = 0;
}

describe('DataTable', () => {
  const montar = async () => {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  };

  it('dibuja encabezados, celdas, "—" para vacíos y plantillas personalizadas', async () => {
    const { el } = await montar();
    expect([...el.querySelectorAll('th')].map((th) => th.textContent?.trim())).toEqual(['Nombre', 'Área', 'Acciones']);
    const filas = [...el.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((td) => td.textContent?.trim()));
    expect(filas).toEqual([['Uno', 'A', 'editar 1'], ['Dos', '—', 'editar 2']]);
    expect(el.querySelector('tbody td:last-child')?.classList).toContain('acciones');
  });

  it('muestra "Cargando..." y "Sin resultados"', async () => {
    const { fixture, el } = await montar();
    fixture.componentInstance.cargando.set(true);
    await fixture.whenStable();
    expect(el.querySelector('.cargando')?.textContent).toContain('Cargando...');
    expect(el.querySelector('table')).toBeNull();

    fixture.componentInstance.cargando.set(false);
    fixture.componentInstance.filas.set([]);
    await fixture.whenStable();
    const vacia = el.querySelector('td.sin-datos');
    expect(vacia?.textContent).toContain('Sin resultados');
    expect(vacia?.getAttribute('colspan')).toBe('3');
  });

  it('el buscador actualiza la búsqueda (two-way) y el botón emite "agregar"', async () => {
    const { fixture, el } = await montar();
    const input = el.querySelector<HTMLInputElement>('.buscador')!;
    input.value = 'dos';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.busqueda()).toBe('dos');

    el.querySelector<HTMLButtonElement>('.btn-agregar')!.click();
    expect(fixture.componentInstance.agregadas).toBe(1);
    expect(el.querySelector('.btn-agregar')?.textContent).toContain('Agregar Fila');
  });
});
