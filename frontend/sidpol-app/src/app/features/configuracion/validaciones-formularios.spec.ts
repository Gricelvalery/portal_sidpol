// Todos los formularios de creación y edición deben rechazar campos obligatorios
// vacíos o con solo espacios: muestran el error junto al campo y NO envían la petición.
// La prueba usa el DOM (etiqueta → input, eventos reales), sin depender de cómo
// está implementado el formulario.
import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { API, iniciarSesion, proveedoresHttp, usuarioDePrueba } from '../../testing/helpers';
import { Modulos } from './modulos/modulos';
import { Submodulos } from './submodulos/submodulos';
import { Areas } from './areas/areas';
import { Dashboards } from './dashboards/dashboards';
import { Usuarios } from './usuarios/usuarios';

const VACIOS: [string, string][] = [
  ['vacío', ''],
  ['solo espacios', '   '],
  ['tabs y saltos de línea', '\t\n '],
  ['8 espacios', '        '],
];

const LINK = 'https://app.powerbi.com/view?r=abc';

/** Respuestas de la API para cargar cada pantalla (con al menos una opción en cada lista). */
const DATOS: Record<string, unknown> = {
  [`${API}/modulos`]: [
    { id_m: 1, nombre_m: 'KPIs', descripcion_m: 'Indicadores', id_area: 1, nombre_area: 'DIRTIC' },
  ],
  [`${API}/areas`]: [{ id_area: 1, nombre_area: 'DIRTIC', descripcion_area: 'Tecnología' }],
  [`${API}/submodulos`]: [
    {
      id_sm: 6,
      nombre_sm: 'Lima',
      descripcion_sm: 'Región',
      modulos_id_m: 1,
      nombre_m: 'KPIs',
      ruta: null,
    },
  ],
  [`${API}/dashboards`]: [
    {
      id_d: 1,
      nombre_d: 'Tendencias',
      link_d: LINK,
      submodulos_id_sm: 6,
      paginas: [],
      nombre_sm: 'Lima',
      nombre_m: 'KPIs',
    },
  ],
  [`${API}/posiciones`]: [
    { id_posicion: 1, nombre_posicion: 'Analista', descripcion_p: null, id_area: 1 },
  ],
  [`${API}/usuarios`]: [
    usuarioDePrueba({ id_u: 3, rol_u: 'user', id_posicion: 1, apellido_materno_u: 'Diaz' }),
  ],
};

interface Formulario {
  nombre: string;
  componente: Type<unknown>;
  modo: 'crear' | 'editar';
  /** Valores válidos para llenar en modo crear (etiqueta → valor). Los <select> eligen la 1.ª opción real. */
  validos: Record<string, string>;
  selects: string[];
  obligatorios: string[];
  metodo: 'POST' | 'PUT';
  url: string;
}

const FORMULARIOS: Formulario[] = [
  {
    nombre: 'Módulos',
    componente: Modulos,
    modo: 'crear',
    validos: { 'Nombre*': 'KPIs', 'Descripción*': 'Indicadores' },
    selects: ['Área'],
    obligatorios: ['Nombre*', 'Descripción*'],
    metodo: 'POST',
    url: `${API}/modulos`,
  },
  {
    nombre: 'Módulos',
    componente: Modulos,
    modo: 'editar',
    validos: {},
    selects: [],
    obligatorios: ['Nombre*', 'Descripción*'],
    metodo: 'PUT',
    url: `${API}/modulos/1`,
  },
  {
    nombre: 'Submódulos',
    componente: Submodulos,
    modo: 'crear',
    validos: { 'Nombre*': 'Lima', 'Descripción*': 'Región' },
    selects: ['Módulo*'],
    obligatorios: ['Nombre*', 'Descripción*'],
    metodo: 'POST',
    url: `${API}/submodulos`,
  },
  {
    nombre: 'Submódulos',
    componente: Submodulos,
    modo: 'editar',
    validos: {},
    selects: [],
    obligatorios: ['Nombre*', 'Descripción*'],
    metodo: 'PUT',
    url: `${API}/submodulos/6`,
  },
  {
    nombre: 'Áreas',
    componente: Areas,
    modo: 'crear',
    validos: { 'Nombre*': 'DIRTIC', 'Descripción*': 'Tecnología' },
    selects: [],
    obligatorios: ['Nombre*', 'Descripción*'],
    metodo: 'POST',
    url: `${API}/areas`,
  },
  {
    nombre: 'Áreas',
    componente: Areas,
    modo: 'editar',
    validos: {},
    selects: [],
    obligatorios: ['Nombre*', 'Descripción*'],
    metodo: 'PUT',
    url: `${API}/areas/1`,
  },
  {
    nombre: 'Dashboards',
    componente: Dashboards,
    modo: 'crear',
    validos: { 'Nombre*': 'Tendencias', 'Link*': LINK },
    selects: ['Submódulo*'],
    obligatorios: ['Nombre*', 'Link*'],
    metodo: 'POST',
    url: `${API}/dashboards`,
  },
  {
    nombre: 'Dashboards',
    componente: Dashboards,
    modo: 'editar',
    validos: {},
    selects: [],
    obligatorios: ['Nombre*', 'Link*'],
    metodo: 'PUT',
    url: `${API}/dashboards/1`,
  },
  {
    nombre: 'Usuarios',
    componente: Usuarios,
    modo: 'crear',
    validos: { 'Nombres*': 'Juan', 'Apellido paterno*': 'Perez', 'Contraseña*': 'Secreta123' },
    selects: ['Posición'],
    obligatorios: ['Nombres*', 'Apellido paterno*', 'Contraseña*'],
    metodo: 'POST',
    url: `${API}/usuarios`,
  },
  {
    nombre: 'Usuarios',
    componente: Usuarios,
    modo: 'editar',
    validos: {},
    selects: [],
    obligatorios: ['Nombres*', 'Apellido paterno*'],
    metodo: 'PUT',
    url: `${API}/usuarios/3`,
  },
];

async function montar(f: Formulario) {
  iniciarSesion();
  TestBed.configureTestingModule({ imports: [f.componente], providers: proveedoresHttp() });
  const backend = TestBed.inject(HttpTestingController);
  const fixture: ComponentFixture<unknown> = TestBed.createComponent(f.componente);
  await fixture.whenStable();
  for (const req of backend.match(() => true)) req.flush(DATOS[req.request.url] ?? []);
  await fixture.whenStable();

  const el = fixture.nativeElement as HTMLElement;
  const boton =
    f.modo === 'crear'
      ? el.querySelector<HTMLButtonElement>('.btn-agregar')
      : el.querySelector<HTMLButtonElement>('.tabla tbody .btn-icono'); // primer botón = editar
  boton!.click();
  await fixture.whenStable();
  return { fixture, backend, el };
}

function campo(el: HTMLElement, etiqueta: string): HTMLElement {
  const c = [...el.querySelectorAll<HTMLElement>('.modal .campo')].find(
    (x) => x.querySelector('label')?.textContent?.trim() === etiqueta,
  );
  if (!c) throw new Error(`No existe el campo "${etiqueta}"`);
  return c;
}

function escribir(el: HTMLElement, etiqueta: string, valor: string) {
  const input = campo(el, etiqueta).querySelector('input')!;
  input.value = valor;
  input.dispatchEvent(new Event('input'));
}

function elegirPrimeraOpcion(el: HTMLElement, etiqueta: string) {
  const select = campo(el, etiqueta).querySelector('select')!;
  select.selectedIndex = 1; // la 0 es "Seleccionar..."
  select.dispatchEvent(new Event('change'));
}

async function llenarYGuardar(
  f: Formulario,
  el: HTMLElement,
  fixture: ComponentFixture<unknown>,
  cambios: Record<string, string>,
) {
  for (const [etiqueta, valor] of Object.entries({ ...f.validos, ...cambios }))
    escribir(el, etiqueta, valor);
  for (const etiqueta of f.selects) elegirPrimeraOpcion(el, etiqueta);
  await fixture.whenStable();
  el.querySelector<HTMLButtonElement>('.modal .btn-guardar')!.click();
  await fixture.whenStable();
}

afterEach(() => localStorage.clear());

describe.each(FORMULARIOS)('$nombre ($modo)', (f) => {
  it('control: con todos los campos válidos SÍ se envía', async () => {
    const { fixture, backend, el } = await montar(f);
    await llenarYGuardar(f, el, fixture, {});
    backend.expectOne({ method: f.metodo, url: f.url });
  });

  describe.each(f.obligatorios)('campo obligatorio %s', (etiqueta) => {
    it.each(VACIOS)('%s → error en el campo y no se envía', async (_caso, valor) => {
      const { fixture, backend, el } = await montar(f);
      await llenarYGuardar(f, el, fixture, { [etiqueta]: valor });

      backend.expectNone({ method: f.metodo, url: f.url });
      expect(campo(el, etiqueta).querySelector('.mensaje-error')?.textContent?.trim()).toBeTruthy();
    });
  });
});
