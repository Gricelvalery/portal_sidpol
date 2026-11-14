jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/areaRepository');

const request = require('supertest');
const app = require('../app');
const usuarioRepository = require('../repositories/usuarioRepository');
const areaRepository = require('../repositories/areaRepository');
const { tokenDe, configurarSesiones, silenciarConsola } = require('./helpers');

const ADMIN = tokenDe(1, 'admin');
const crearArea = () =>
  request(app)
    .post('/api/area')
    .set('Authorization', ADMIN)
    .send({ nombre_area: 'Área X', descripcion_area: 'Descripción' });

let restaurar;
beforeEach(() => {
  configurarSesiones(usuarioRepository, { 1: { rol: 'admin' } });
  restaurar = silenciarConsola();
});
afterEach(() => restaurar());

test('ruta inexistente → 404 en JSON', async () => {
  const res = await request(app).get('/api/no-existe');
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: 'Ruta no encontrada' });
});

test('JSON mal formado → 400', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"username": ');
  expect(res.status).toBe(400);
  expect(res.body).toEqual({ error: 'JSON inválido' });
});

test('body mayor a 100 KB → 413', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'x', contrasenia: 'a'.repeat(200 * 1024) });
  expect(res.status).toBe(413);
});

test.each([
  [
    '23505',
    409,
    'El registro ya existe',
    'duplicate key value violates unique constraint "area_nombre_key"',
  ],
  [
    '23503',
    409,
    'El registro está en uso o referencia un dato inexistente',
    'violates foreign key constraint "fk_modulos_area" on table "modulos"',
  ],
  ['22001', 400, 'Valor demasiado largo', 'value too long for type character varying(100)'],
])(
  'error de PostgreSQL %s → %i genérico, sin nombres internos',
  async (code, status, mensaje, interno) => {
    areaRepository.insertar.mockRejectedValue(Object.assign(new Error(interno), { code }));
    const res = await crearArea();
    expect(res.status).toBe(status);
    expect(res.body).toEqual({ error: mensaje });
  },
);

test('error desconocido → 500 "Error interno"', async () => {
  areaRepository.insertar.mockRejectedValue(
    new TypeError('Cannot read properties of undefined (reading "id_area")'),
  );
  const res = await crearArea();
  expect(res.status).toBe(500);
  expect(res.body).toEqual({ error: 'Error interno' });
});

test('cabeceras de seguridad: helmet activo y sin X-Powered-By', async () => {
  const res = await request(app).get('/api/no-existe');
  expect(res.headers['x-powered-by']).toBeUndefined();
  expect(res.headers['x-content-type-options']).toBe('nosniff');
});
