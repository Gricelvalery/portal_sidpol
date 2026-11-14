jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/moduloRepository');

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../app');
const env = require('../config/env');
const usuarioRepository = require('../repositories/usuarioRepository');
const moduloRepository = require('../repositories/moduloRepository');
const { tokenDe, configurarSesiones, usuarioDe } = require('./helpers');

const HASH = bcrypt.hashSync('Secreta123', 4);
const login = (username, contrasenia) =>
  request(app).post('/api/auth/login').send({ username, contrasenia });

beforeEach(() => {
  usuarioRepository.buscarCredenciales.mockResolvedValue(null);
  moduloRepository.listar.mockResolvedValue([]);
  configurarSesiones(usuarioRepository, { 1: { rol: 'admin' }, 2: { rol: 'user' } });
});

describe('POST /api/auth/login', () => {

  test('credenciales correctas → 200, token HS256 de 2 horas y usuario sin contraseña', async () => {
    usuarioRepository.buscarCredenciales.mockResolvedValue({
      usuario: usuarioDe({ id_u: 2, rol_u: 'user' }), hash: HASH, autorizado: true
    });

    const res = await login('  Juan.Perez ', 'Secreta123');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(usuarioRepository.buscarCredenciales).toHaveBeenCalledWith('juan.perez');

    const payload = jwt.verify(res.body.token, env.JWT_SECRET, { algorithms: ['HS256'] });
    expect(payload).toMatchObject({ id: 2, rol: 'user' });
    expect(payload.exp - payload.iat).toBe(2 * 60 * 60);
    expect(jwt.decode(res.body.token, { complete: true }).header.alg).toBe('HS256');

    expect(res.body.usuario).toMatchObject({ id_u: 2, username: 'juan.perez', correo_u: 'juan.perez@sidpol.pe' });
    expect(JSON.stringify(res.body)).not.toContain('contrasenia');
    expect(JSON.stringify(res.body)).not.toContain('NO-DEBE-SALIR');
  });

  test('contraseña incorrecta → 401', async () => {
    usuarioRepository.buscarCredenciales.mockResolvedValue({ usuario: usuarioDe(), hash: HASH, autorizado: true });
    const res = await login('juan.perez', 'otra-clave');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Credenciales incorrectas' });
  });

  test('usuario inexistente → 401 con el MISMO mensaje (no revela qué usuarios existen)', async () => {
    const res = await login('no.existe', 'loquesea');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Credenciales incorrectas' });
  });

  test('usuario no autorizado → 403', async () => {
    usuarioRepository.buscarCredenciales.mockResolvedValue({ usuario: usuarioDe(), hash: HASH, autorizado: false });
    const res = await login('juan.perez', 'Secreta123');
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/no autorizado/i);
  });

  test('tipos inválidos → 400 sin consultar la BD', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 123, contrasenia: ['x'] });
    expect(res.status).toBe(400);
    expect(res.body.errors.map(e => e.path)).toEqual(expect.arrayContaining(['username', 'contrasenia']));
    expect(usuarioRepository.buscarCredenciales).not.toHaveBeenCalled();
  });

  test('rate limit: 5 intentos fallidos → el 6.º responde 429', async () => {
    const estados = [];
    for (let i = 0; i < 6; i++) estados.push((await login('bloqueo.prueba', 'mala')).status);
    expect(estados).toEqual([401, 401, 401, 401, 401, 429]);

    const bloqueado = await login('bloqueo.prueba', 'mala');
    expect(bloqueado.body).toEqual({ error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' });

    // otro usuario desde la misma IP no queda bloqueado
    expect((await login('otro.usuario', 'mala')).status).toBe(401);
  });

});

describe('middleware de autenticación (verificarToken)', () => {
  const get = (authorization) => {
    const r = request(app).get('/api/modulos');
    return authorization ? r.set('Authorization', authorization) : r;
  };

  test('token válido → 200', async () => {
    expect((await get(tokenDe(1, 'admin'))).status).toBe(200);
  });

  test.each([
    ['sin header', undefined],
    ['esquema "bearer" en minúscula', tokenDe(1, 'admin').replace('Bearer', 'bearer')],
    ['partes de más', tokenDe(1, 'admin') + ' extra'],
    ['algoritmo HS512', tokenDe(1, 'admin', { algorithm: 'HS512' })],
    ['token vencido', tokenDe(1, 'admin', { expiresIn: -10 })],
    ['firmado con otro secreto', tokenDe(1, 'admin', { secreto: 'otro-secreto-cualquiera-de-32-caracteres!!' })]
  ])('%s → 401', async (_caso, authorization) => {
    expect((await get(authorization)).status).toBe(401);
  });

  test('usuario desautorizado o eliminado → 401 aunque el token sea válido', async () => {
    configurarSesiones(usuarioRepository, { 1: { rol: 'admin', autorizado: false } });
    expect((await get(tokenDe(1, 'admin'))).body).toEqual({ error: 'Sesión no válida' });
    expect((await get(tokenDe(99, 'admin'))).status).toBe(401);
  });

  test('el rol sale de la BD, no del token: token "admin" de un user → 403 en rutas de admin', async () => {
    const res = await request(app).get('/api/usuario').set('Authorization', tokenDe(2, 'admin'));
    expect(res.status).toBe(403);
  });

});
