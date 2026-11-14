// Los logs reales de la app (pino) no deben contener contraseñas, tokens, hashes,
// el header Authorization ni el detalle de errores de PostgreSQL.
jest.mock('../config/logger', () => {
  const real = jest.requireActual('../config/logger');
  const lineas = [];
  const logger = real.crearLogger({ write: (linea) => lineas.push(linea) });
  logger.level = 'info'; // en pruebas el nivel por defecto es "silent"
  return { ...real, logger, __lineas: lineas };
});
jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/moduloRepository');

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const loggerMod = require('../config/logger');
const usuarioRepository = require('../repositories/usuarioRepository');
const moduloRepository = require('../repositories/moduloRepository');
const { configurarSesiones, usuarioDe } = require('./helpers');

const CLAVE = 'ClaveSecreta-123!';
const CLAVE_MALA = 'OtraClaveMala-999';
const HASH = bcrypt.hashSync(CLAVE, 4);
const CORREO_EN_DETALLE = 'persona.privada@sidpol.pe';

const logs = () => loggerMod.__lineas.join('');
const entradas = () => loggerMod.__lineas.map((l) => JSON.parse(l));

beforeEach(() => {
  loggerMod.__lineas.length = 0;
  configurarSesiones(usuarioRepository, { 1: { rol: 'admin' } });
  usuarioRepository.buscarCredenciales.mockResolvedValue({
    usuario: usuarioDe({ id_u: 1, rol_u: 'admin' }),
    hash: HASH,
    autorizado: true,
  });
  moduloRepository.listar.mockResolvedValue([]);
});

test('login correcto + petición autenticada: sin contraseña, token, hash ni Authorization', async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ username: 'juan.perez', contrasenia: CLAVE });
  expect(login.status).toBe(200);
  const token = login.body.token;

  await request(app).get('/api/modulos').set('Authorization', `Bearer ${token}`);

  const texto = logs();
  expect(texto).not.toContain(CLAVE);
  expect(texto).not.toContain(token);
  expect(texto).not.toContain(HASH);
  expect(texto).not.toMatch(/Bearer/i);
  expect(texto).not.toMatch(/contrasenia/i);

  // Sí registra lo útil: método, ruta, estado e id de usuario
  const [entradaLogin, entradaModulos] = entradas();
  expect(entradaLogin).toMatchObject({ msg: 'POST /api/auth/login → 200' });
  expect(entradaLogin.req).toEqual({
    id: expect.any(String),
    method: 'POST',
    url: '/api/auth/login',
  });
  expect(entradaModulos).toMatchObject({ msg: 'GET /api/modulos → 200', usuario: 1 });
});

test('login fallido: se registra el 401 como advertencia, sin la contraseña probada', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'juan.perez', contrasenia: CLAVE_MALA });
  expect(res.status).toBe(401);

  expect(logs()).not.toContain(CLAVE_MALA);
  expect(logs()).not.toContain('juan.perez'); // el body (con el username) tampoco se registra
  expect(entradas()[0]).toMatchObject({ level: 40, msg: 'POST /api/auth/login → 401' });
});

test('error de BD: se registra código y mensaje, pero no err.detail (valores de filas)', async () => {
  moduloRepository.listar.mockRejectedValue(
    Object.assign(new Error('duplicate key value violates unique constraint'), {
      code: '23505',
      detail: `Key (correo_u)=(${CORREO_EN_DETALLE}) already exists.`,
    }),
  );
  const login = await request(app)
    .post('/api/auth/login')
    .send({ username: 'juan.perez', contrasenia: CLAVE });
  const res = await request(app)
    .get('/api/modulos')
    .set('Authorization', `Bearer ${login.body.token}`);
  expect(res.status).toBe(409);

  expect(logs()).not.toContain(CORREO_EN_DETALLE);
  const errorBd = entradas().find((e) => e.msg === 'Error de BD 23505');
  expect(errorBd.err).toMatchObject({ code: '23505', message: expect.any(String) });
  expect(errorBd.err).not.toHaveProperty('detail');
});

test('redact: cualquier campo sensible que llegue al logger se reemplaza', () => {
  loggerMod.logger.info(
    { contrasenia: 'x1', datos: { token: 'x2', password: 'x3' }, authorization: 'Bearer x4' },
    'prueba',
  );
  const entrada = entradas()[0];
  expect(entrada.contrasenia).toBe(loggerMod.CENSURA);
  expect(entrada.datos).toEqual({ token: loggerMod.CENSURA, password: loggerMod.CENSURA });
  expect(entrada.authorization).toBe(loggerMod.CENSURA);
});
