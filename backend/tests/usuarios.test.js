jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/permisoRepository');
jest.mock('../repositories/transaccion', () => ({
  withTransaction: jest.fn(async (fn) => fn({ esClienteDeTransaccion: true }))
}));

const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const usuarioRepository = require('../repositories/usuarioRepository');
const permisoRepository = require('../repositories/permisoRepository');
const { withTransaction } = require('../repositories/transaccion');
const Usuario = require('../models/Usuario');
const { tokenDe, configurarSesiones, usuarioDe, silenciarConsola } = require('./helpers');

const ADMIN = tokenDe(1, 'admin');
const CLIENTE = { esClienteDeTransaccion: true };

const nuevo = (extra = {}) => ({
  nombres_u: 'Juan Carlos',
  apellido_paterno_u: 'Pérez',
  apellido_materno_u: 'Cáceres',
  contrasenia_u: 'Secreta123',
  id_posicion: 2,
  ...extra
});
const crear = (body, token = ADMIN) =>
  request(app).post('/api/usuario').set('Authorization', token).send(body);

beforeEach(() => {
  configurarSesiones(usuarioRepository, { 1: { rol: 'admin' }, 2: { rol: 'user' }, 3: { rol: 'user' }, 4: { rol: 'admin' } });
  usuarioRepository.usernamesConPrefijo.mockResolvedValue(new Set());
  usuarioRepository.insertar.mockImplementation(async (datos) => new Usuario({ id_u: 50, ...datos }));
  usuarioRepository.bloquearAdminsAutorizados.mockResolvedValue([1, 4]);
  usuarioRepository.actualizar.mockImplementation(async (id, datos) =>
    usuarioDe({ id_u: id, ...datos, username: 'usuario.original', correo_u: 'usuario.original@sidpol.pe' }));
  usuarioRepository.eliminar.mockResolvedValue(true);
});

describe('POST /api/usuario (crear)', () => {

  test('genera username y correo, fuerza rol "user", guarda hash y NO crea permisos', async () => {
    const res = await crear(nuevo({ rol_u: 'admin', correo_u: 'yo@gmail.com', autorizado: true }));

    expect(res.status).toBe(201);
    expect(res.body.usuario).toMatchObject({
      username: 'juan.perez', correo_u: 'juan.perez@sidpol.pe', rol_u: 'user', autorizado: true
    });

    const guardado = usuarioRepository.insertar.mock.calls[0][0];
    expect(guardado.rol_u).toBe('user');                      // ignora rol_u del body
    expect(guardado.correo_u).toBe('juan.perez@sidpol.pe');   // ignora correo_u del body
    expect(guardado.contrasenia_u).not.toBe('Secreta123');    // nunca en texto plano
    expect(bcrypt.compareSync('Secreta123', guardado.contrasenia_u)).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain(guardado.contrasenia_u);

    expect(permisoRepository.reemplazar).not.toHaveBeenCalled();
    expect(usuarioRepository.usernamesConPrefijo).toHaveBeenCalledTimes(1); // una sola consulta
    expect(usuarioRepository.usernamesConPrefijo).toHaveBeenCalledWith('juan.perez');
  });

  test.each([
    ['juan.perez ocupado → inicial del materno', ['juan.perez'], 'Cáceres', 'juan.perezc'],
    ['también juan.perezc → número', ['juan.perez', 'juan.perezc'], 'Cáceres', 'juan.perezc2'],
    ['hasta juan.perezc2 → juan.perezc3', ['juan.perez', 'juan.perezc', 'juan.perezc2'], 'Cáceres', 'juan.perezc3'],
    ['sin materno → número directo', ['juan.perez'], '', 'juan.perez2'],
    ['huecos: usa el primero libre', ['juan.perez', 'juan.perezc', 'juan.perezc3'], 'Cáceres', 'juan.perezc2']
  ])('colisión: %s', async (_caso, ocupados, materno, esperado) => {
    usuarioRepository.usernamesConPrefijo.mockResolvedValue(new Set(ocupados));
    const res = await crear(nuevo({ apellido_materno_u: materno }));
    expect(res.status).toBe(201);
    expect(res.body.usuario.username).toBe(esperado);
    expect(res.body.usuario.correo_u).toBe(`${esperado}@sidpol.pe`);
  });

  test('normaliza tildes y ñ en el username', async () => {
    const res = await crear(nuevo({ nombres_u: 'Ñuño', apellido_paterno_u: 'Muñoz', apellido_materno_u: '' }));
    expect(res.body.usuario.username).toBe('nuno.munoz');
  });

  test('carrera con otro admin (UNIQUE 23505) → reintenta con el siguiente username libre', async () => {
    usuarioRepository.usernamesConPrefijo
      .mockResolvedValueOnce(new Set())
      .mockResolvedValueOnce(new Set(['juan.perez']));
    usuarioRepository.insertar.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: '23505' }));

    const res = await crear(nuevo());
    expect(res.status).toBe(201);
    expect(res.body.usuario.username).toBe('juan.perezc');
    expect(usuarioRepository.insertar).toHaveBeenCalledTimes(2);
  });

  test('validación: falta apellido paterno y nombre con números → 400; no pide correo', async () => {
    const res = await crear(nuevo({ apellido_paterno_u: '', nombres_u: 'Juan2' }));
    expect(res.status).toBe(400);
    const campos = res.body.errors.map(e => e.path);
    expect(campos).toEqual(expect.arrayContaining(['apellido_paterno_u', 'nombres_u']));
    expect(campos).not.toContain('correo_u');
    expect(usuarioRepository.insertar).not.toHaveBeenCalled();
  });

  test('un user no puede crear usuarios → 403', async () => {
    expect((await crear(nuevo(), tokenDe(2, 'user'))).status).toBe(403);
    expect(usuarioRepository.insertar).not.toHaveBeenCalled();
  });

  test('error inesperado de la BD → 500 "Error interno" sin detalles', async () => {
    const restaurar = silenciarConsola();
    usuarioRepository.insertar.mockRejectedValue(new Error('relation "usuario" column "contrasenia_u" secreto'));
    const res = await crear(nuevo());
    restaurar();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Error interno' });
  });

});

describe('PUT /api/usuario/:id (editar)', () => {
  const editar = (id, body, token = ADMIN) =>
    request(app).put(`/api/usuario/${id}`).set('Authorization', token).send({
      nombres_u: 'Pedro', apellido_paterno_u: 'Nuevo', rol_u: 'user', id_posicion: 1, autorizado: true, ...body
    });

  test('cambiar el nombre NO cambia username ni correo', async () => {
    const res = await editar(3, { username: 'hackeado', correo_u: 'x@x.com' });

    expect(res.status).toBe(200);
    const [, datos, ejecutor] = usuarioRepository.actualizar.mock.calls[0];
    expect(datos).not.toHaveProperty('username');
    expect(datos).not.toHaveProperty('correo_u');
    expect(datos).not.toHaveProperty('contrasenia_u');
    expect(ejecutor).toEqual(CLIENTE);  // dentro de la transacción
    expect(res.body.usuario.username).toBe('usuario.original');
  });

  test('bloquea admins y usuario objetivo dentro de la transacción (FOR UPDATE)', async () => {
    await editar(3, {});
    expect(withTransaction).toHaveBeenCalledTimes(1);
    expect(usuarioRepository.bloquearAdminsAutorizados).toHaveBeenCalledWith(CLIENTE);
    expect(usuarioRepository.obtenerEstado).toHaveBeenCalledWith(3, CLIENTE, { bloquear: true });
  });

  test('un admin no puede quitarse su propio rol → 400', async () => {
    const res = await editar(1, { rol_u: 'user' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No puedes quitarte el rol/);
    expect(usuarioRepository.actualizar).not.toHaveBeenCalled();
  });

  test('no se puede dejar el sistema sin admins autorizados → 400', async () => {
    usuarioRepository.bloquearAdminsAutorizados.mockResolvedValue([4]); // 4 es el único admin
    const res = await editar(4, { autorizado: false, rol_u: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Debe existir al menos un administrador autorizado');
  });

  test('usuario inexistente → 404', async () => {
    const res = await editar(99, {});
    expect(res.status).toBe(404);
  });

  test('id no numérico y autorizado no booleano → 400', async () => {
    expect((await editar('abc', {})).status).toBe(400);
    expect((await editar(3, { autorizado: 'quizas' })).status).toBe(400);
  });

});

describe('DELETE /api/usuario/:id', () => {
  const borrar = (id) => request(app).delete(`/api/usuario/${id}`).set('Authorization', ADMIN);

  test('elimina permisos y usuario en la misma transacción', async () => {
    const res = await borrar(3);
    expect(res.status).toBe(200);
    expect(permisoRepository.eliminarDeUsuario).toHaveBeenCalledWith(3, CLIENTE);
    expect(usuarioRepository.eliminar).toHaveBeenCalledWith(3, CLIENTE);
    expect(permisoRepository.eliminarDeUsuario.mock.invocationCallOrder[0])
      .toBeLessThan(usuarioRepository.eliminar.mock.invocationCallOrder[0]);
  });

  test('no puedes eliminarte a ti mismo → 400', async () => {
    const res = await borrar(1);
    expect(res.status).toBe(400);
    expect(usuarioRepository.eliminar).not.toHaveBeenCalled();
  });

  test('no se puede eliminar al último admin → 400', async () => {
    usuarioRepository.bloquearAdminsAutorizados.mockResolvedValue([4]);
    expect((await borrar(4)).status).toBe(400);
  });

  test('inexistente → 404', async () => {
    expect((await borrar(99)).status).toBe(404);
  });

});

describe('GET /api/usuario', () => {

  test('admin lista usuarios sin contraseñas', async () => {
    usuarioRepository.listar.mockResolvedValue([usuarioDe({ id_u: 2 }), usuarioDe({ id_u: 3, username: 'ana.ruiz' })]);
    const res = await request(app).get('/api/usuario').set('Authorization', ADMIN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(JSON.stringify(res.body)).not.toMatch(/contrasenia|NO-DEBE-SALIR/);
  });

  test('user → 403', async () => {
    expect((await request(app).get('/api/usuario').set('Authorization', tokenDe(2))).status).toBe(403);
  });

});
