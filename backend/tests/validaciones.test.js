// Todos los formularios de creación y edición deben rechazar campos obligatorios
// vacíos o con solo espacios (400 con el error en ese campo), y guardar los textos
// sin espacios sobrantes.
jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/permisoRepository');
jest.mock('../repositories/areaRepository');
jest.mock('../repositories/posicionRepository');
jest.mock('../repositories/moduloRepository');
jest.mock('../repositories/submoduloRepository');
jest.mock('../repositories/dashboardRepository');
jest.mock('../repositories/transaccion', () => ({
  withTransaction: jest.fn(async (fn) => fn({ esClienteDeTransaccion: true })),
}));

const request = require('supertest');
const app = require('../app');
const usuarioRepository = require('../repositories/usuarioRepository');
const areaRepository = require('../repositories/areaRepository');
const posicionRepository = require('../repositories/posicionRepository');
const moduloRepository = require('../repositories/moduloRepository');
const submoduloRepository = require('../repositories/submoduloRepository');
const dashboardRepository = require('../repositories/dashboardRepository');
const Usuario = require('../models/Usuario');
const { tokenDe, configurarSesiones, usuarioDe } = require('./helpers');

const ADMIN = tokenDe(1, 'admin');
const VACIOS = [
  ['vacío', ''],
  ['solo espacios', '   '],
  ['tabs y saltos de línea', '\t\n '],
  // largo suficiente para pasar cualquier mínimo de longitud (p. ej. contraseña ≥ 6)
  ['8 espacios', '        '],
];
const LINK = 'https://app.powerbi.com/view?r=abc';

/**
 * Formularios: cuerpo válido + campos de texto obligatorios.
 * (Los campos numéricos como id_area ya se validan con isInt.)
 */
const FORMULARIOS = [
  {
    nombre: 'usuarios (crear)',
    metodo: 'post',
    ruta: '/api/usuarios',
    cuerpo: {
      nombres_u: 'Juan',
      apellido_paterno_u: 'Perez',
      contrasenia_u: 'Secreta123',
      id_posicion: 1,
      autorizado: true,
    },
    obligatorios: ['nombres_u', 'apellido_paterno_u', 'contrasenia_u'],
  },
  {
    nombre: 'usuarios (editar)',
    metodo: 'put',
    ruta: '/api/usuarios/3',
    cuerpo: {
      nombres_u: 'Juan',
      apellido_paterno_u: 'Perez',
      rol_u: 'user',
      id_posicion: 1,
      autorizado: true,
    },
    obligatorios: ['nombres_u', 'apellido_paterno_u'],
  },
  {
    nombre: 'áreas (crear)',
    metodo: 'post',
    ruta: '/api/areas',
    cuerpo: { nombre_area: 'DIRTIC', descripcion_area: 'Tecnología' },
    obligatorios: ['nombre_area', 'descripcion_area'],
  },
  {
    nombre: 'áreas (editar)',
    metodo: 'put',
    ruta: '/api/areas/1',
    cuerpo: { nombre_area: 'DIRTIC', descripcion_area: 'Tecnología' },
    obligatorios: ['nombre_area', 'descripcion_area'],
  },
  {
    nombre: 'posiciones (crear)',
    metodo: 'post',
    ruta: '/api/posiciones',
    cuerpo: { nombre_posicion: 'Analista', id_area: 1 },
    obligatorios: ['nombre_posicion'],
  },
  {
    nombre: 'módulos (crear)',
    metodo: 'post',
    ruta: '/api/modulos',
    cuerpo: { nombre_m: 'KPIs', descripcion_m: 'Indicadores', id_area: 1 },
    obligatorios: ['nombre_m', 'descripcion_m'],
  },
  {
    nombre: 'módulos (editar)',
    metodo: 'put',
    ruta: '/api/modulos/1',
    cuerpo: { nombre_m: 'KPIs', descripcion_m: 'Indicadores', id_area: 1 },
    obligatorios: ['nombre_m', 'descripcion_m'],
  },
  {
    nombre: 'submódulos (crear)',
    metodo: 'post',
    ruta: '/api/submodulos',
    cuerpo: { nombre_sm: 'Lima', descripcion_sm: 'Región', modulos_id_m: 1 },
    obligatorios: ['nombre_sm', 'descripcion_sm'],
  },
  {
    nombre: 'submódulos (editar)',
    metodo: 'put',
    ruta: '/api/submodulos/1',
    cuerpo: { nombre_sm: 'Lima', descripcion_sm: 'Región', modulos_id_m: 1 },
    obligatorios: ['nombre_sm', 'descripcion_sm'],
  },
  {
    nombre: 'dashboards (crear)',
    metodo: 'post',
    ruta: '/api/dashboards',
    cuerpo: {
      nombre_d: 'Tendencias',
      link_d: LINK,
      submodulos_id_sm: 6,
      paginas: [{ nombre: 'P1' }],
    },
    obligatorios: ['nombre_d', 'link_d', 'paginas[0].nombre'],
  },
  {
    nombre: 'dashboards (editar)',
    metodo: 'put',
    ruta: '/api/dashboards/1',
    cuerpo: {
      nombre_d: 'Tendencias',
      link_d: LINK,
      submodulos_id_sm: 6,
      paginas: [{ nombre: 'P1' }],
    },
    obligatorios: ['nombre_d', 'link_d', 'paginas[0].nombre'],
  },
];

/** Copia el cuerpo poniendo `valor` en el campo (admite "paginas[0].nombre"). */
function conCampo(cuerpo, campo, valor) {
  const copia = structuredClone(cuerpo);
  const m = campo.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
  if (m) copia[m[1]][Number(m[2])][m[3]] = valor;
  else copia[campo] = valor;
  return copia;
}

const enviar = (f, cuerpo) =>
  request(app)[f.metodo](f.ruta).set('Authorization', ADMIN).send(cuerpo);

beforeEach(() => {
  configurarSesiones(usuarioRepository, { 1: { rol: 'admin' }, 3: { rol: 'user' } });
  usuarioRepository.usernamesConPrefijo.mockResolvedValue(new Set());
  usuarioRepository.insertar.mockImplementation(async (d) => new Usuario({ id_u: 50, ...d }));
  usuarioRepository.bloquearAdminsAutorizados.mockResolvedValue([1]);
  usuarioRepository.actualizar.mockImplementation(async (id, d) => usuarioDe({ id_u: id, ...d }));
  for (const repo of [
    areaRepository,
    posicionRepository,
    moduloRepository,
    submoduloRepository,
    dashboardRepository,
  ]) {
    repo.insertar.mockImplementation(async (d) => d);
    if (repo.actualizar) repo.actualizar.mockImplementation(async (_id, d) => d);
  }
});

describe.each(FORMULARIOS)('$nombre', (f) => {
  test('el cuerpo de referencia es válido (control)', async () => {
    const res = await enviar(f, f.cuerpo);
    expect([200, 201]).toContain(res.status);
  });

  describe.each(f.obligatorios)('campo obligatorio %s', (campo) => {
    test.each(VACIOS)('%s → 400 con error en el campo', async (_caso, valor) => {
      const res = await enviar(f, conCampo(f.cuerpo, campo, valor));
      expect(res.status).toBe(400);
      expect(res.body.errors.map((e) => e.path)).toContain(campo);
    });
  });
});

describe('espacios sobrantes', () => {
  test('los textos se guardan sin espacios al inicio ni al final', async () => {
    await enviar(FORMULARIOS[2], {
      nombre_area: '  DIRTIC  ',
      descripcion_area: '\tTecnología \n',
    });
    expect(areaRepository.insertar).toHaveBeenCalledWith(
      expect.objectContaining({ nombre_area: 'DIRTIC', descripcion_area: 'Tecnología' }),
    );
  });

  test('la contraseña NO se recorta (los espacios forman parte de ella)', async () => {
    const res = await enviar(FORMULARIOS[0], {
      ...FORMULARIOS[0].cuerpo,
      contrasenia_u: '  clave con espacios  ',
    });
    expect(res.status).toBe(201);
    const bcrypt = require('bcrypt');
    expect(
      bcrypt.compareSync(
        '  clave con espacios  ',
        usuarioRepository.insertar.mock.calls[0][0].contrasenia_u,
      ),
    ).toBe(true);
  });

  test.each([
    ['apellido materno', 0, 'apellido_materno_u', usuarioRepository, 'insertar'],
    ['descripción de posición', 4, 'descripcion_p', posicionRepository, 'insertar'],
  ])(
    'opcional con solo espacios (%s) se guarda como null',
    async (_caso, i, campo, repo, metodo) => {
      const res = await enviar(FORMULARIOS[i], { ...FORMULARIOS[i].cuerpo, [campo]: '   ' });
      expect([200, 201]).toContain(res.status);
      expect(repo[metodo].mock.calls[0][0][campo]).toBeNull();
    },
  );
});
