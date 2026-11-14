jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/permisoRepository');
jest.mock('../repositories/submoduloRepository');
jest.mock('../repositories/moduloRepository');
jest.mock('../repositories/dashboardRepository');
jest.mock('../repositories/transaccion', () => ({
  withTransaction: jest.fn(async (fn) => fn({ esClienteDeTransaccion: true })),
}));

const request = require('supertest');
const app = require('../app');
const usuarioRepository = require('../repositories/usuarioRepository');
const permisoRepository = require('../repositories/permisoRepository');
const submoduloRepository = require('../repositories/submoduloRepository');
const moduloRepository = require('../repositories/moduloRepository');
const dashboardRepository = require('../repositories/dashboardRepository');
const { withTransaction } = require('../repositories/transaccion');
const Submodulo = require('../models/Submodulo');
const Dashboard = require('../models/Dashboard');
const { tokenDe, configurarSesiones } = require('./helpers');

const ADMIN = tokenDe(1, 'admin');
const USER = tokenDe(2, 'user'); // tiene acceso al submódulo 6 y al dashboard 1
const SIN_PERMISOS = tokenDe(7, 'user'); // no tiene ningún acceso
const CLIENTE = { esClienteDeTransaccion: true };

const get = (url, token) => request(app).get(url).set('Authorization', token);

beforeEach(() => {
  configurarSesiones(usuarioRepository, {
    1: { rol: 'admin' },
    2: { rol: 'user' },
    7: { rol: 'user' },
  });
  permisoRepository.accesos.mockImplementation(async (id) =>
    id === 2 ? { submodulos: [6], dashboards: [1] } : { submodulos: [], dashboards: [] },
  );
  permisoRepository.tieneAcceso.mockImplementation(
    async (id, tipo, recurso) =>
      id === 2 &&
      ((tipo === 'submodulo' && recurso === 6) || (tipo === 'dashboard' && recurso === 1)),
  );
  submoduloRepository.listar.mockImplementation(async ({ ids } = {}) =>
    [6, 7]
      .filter((id) => !ids || ids.includes(id))
      .map((id) => new Submodulo({ id_sm: id, nombre_sm: `S${id}` })),
  );
  moduloRepository.listar.mockResolvedValue([]);
  dashboardRepository.listar.mockResolvedValue([
    new Dashboard({ id_d: 1, nombre_d: 'D1', submodulos_id_sm: 6 }),
  ]);
  dashboardRepository.obtener.mockResolvedValue(new Dashboard({ id_d: 1, nombre_d: 'D1' }));
  permisoRepository.submodulosDeConfiguracion.mockResolvedValue([]);
});

describe('listados filtrados por permisos', () => {
  test('admin ve todo: el repositorio se llama sin filtro y no se consultan permisos', async () => {
    const res = await get('/api/submodulos', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body.map((s) => s.id_sm)).toEqual([6, 7]);
    expect(submoduloRepository.listar).toHaveBeenCalledWith();
    expect(permisoRepository.accesos).not.toHaveBeenCalled();
  });

  test('user ve solo sus submódulos, módulos y dashboards', async () => {
    const res = await get('/api/submodulos', USER);
    expect(res.body.map((s) => s.id_sm)).toEqual([6]);
    expect(submoduloRepository.listar).toHaveBeenCalledWith({ ids: [6] });

    await get('/api/modulos', USER);
    expect(moduloRepository.listar).toHaveBeenCalledWith({ idsSubmodulos: [6] });

    await get('/api/dashboards', USER);
    expect(dashboardRepository.listar).toHaveBeenCalledWith({ ids: [1] });
  });

  test('user sin permisos → listas vacías (el frontend muestra "Aún no tienes accesos asignados")', async () => {
    const res = await get('/api/submodulos', SIN_PERMISOS);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(submoduloRepository.listar).toHaveBeenCalledWith({ ids: [] });
  });
});

describe('checkPermission', () => {
  test('submódulo propio → 200, solo con sus dashboards', async () => {
    const res = await get('/api/submodulos/6/dashboards', USER);
    expect(res.status).toBe(200);
    expect(dashboardRepository.listar).toHaveBeenCalledWith({ idSubmodulo: 6, ids: [1] });
  });

  test('submódulo ajeno → 403 y no se consultan dashboards', async () => {
    const res = await get('/api/submodulos/7/dashboards', USER);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No tienes acceso a este recurso' });
    expect(dashboardRepository.listar).not.toHaveBeenCalled();
  });

  test('dashboard ajeno → 403; propio → 200', async () => {
    expect((await get('/api/dashboards/2', USER)).status).toBe(403);
    expect((await get('/api/dashboards/1', USER)).status).toBe(200);
  });

  test('admin pasa sin consultar permisos', async () => {
    const res = await get('/api/submodulos/7/dashboards', ADMIN);
    expect(res.status).toBe(200);
    expect(permisoRepository.tieneAcceso).not.toHaveBeenCalled();
    expect(dashboardRepository.listar).toHaveBeenCalledWith({ idSubmodulo: 7 });
  });

  test('id inválido → 400', async () => {
    expect((await get('/api/submodulos/abc/dashboards', USER)).status).toBe(400);
  });

  test('un error de la BD se propaga como 500 (no se traga ni se convierte en "sin acceso")', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    permisoRepository.tieneAcceso.mockRejectedValue(new Error('conexión perdida'));
    const res = await get('/api/submodulos/6/dashboards', USER);
    console.error.mockRestore();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error interno' });
  });
});

describe('asignar permisos (admin)', () => {
  const guardar = (id, body, token = ADMIN) =>
    request(app).post(`/api/usuario/${id}/permisos`).set('Authorization', token).send(body);

  test('reemplaza permisos dentro de una transacción y quita duplicados', async () => {
    const res = await guardar(2, { submodulos_ids: [8, 8], dashboards_ids: [1, 2] });
    expect(res.status).toBe(200);
    expect(withTransaction).toHaveBeenCalledTimes(1);
    expect(permisoRepository.reemplazar).toHaveBeenCalledWith(2, [8], [1, 2], CLIENTE);
  });

  test('submódulo de configuración → 400 y no se toca nada', async () => {
    permisoRepository.submodulosDeConfiguracion.mockResolvedValue([4]);
    const res = await guardar(2, { submodulos_ids: [4] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/configuración/);
    expect(permisoRepository.reemplazar).not.toHaveBeenCalled();
  });

  test('si falla el guardado, el error se propaga (la transacción hace ROLLBACK)', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    permisoRepository.reemplazar.mockRejectedValue(new Error('falla a mitad'));
    const res = await guardar(2, { dashboards_ids: [1] });
    console.error.mockRestore();
    expect(res.status).toBe(500);
  });

  test('ids no numéricos → 400', async () => {
    expect((await guardar(2, { dashboards_ids: ['x'] })).status).toBe(400);
  });

  test('un user no puede asignar permisos → 403', async () => {
    expect((await guardar(2, { dashboards_ids: [1] }, USER)).status).toBe(403);
  });

  test('ver permisos asignados de un usuario', async () => {
    permisoRepository.asignados.mockResolvedValue({ submodulos_ids: [8], dashboards_ids: [1] });
    const res = await get('/api/usuario/2/permisos', ADMIN);
    expect(res.body).toEqual({ submodulos_ids: [8], dashboards_ids: [1] });
  });

  test('usuario inexistente → 404', async () => {
    expect((await guardar(99, { dashboards_ids: [1] })).status).toBe(404);
  });
});
