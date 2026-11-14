// withTransaction real, con un pool simulado: COMMIT si todo sale bien, ROLLBACK si falla.
jest.mock('../config/db', () => {
  const consultas = [];
  const client = {
    query: jest.fn(async (sql) => {
      consultas.push(sql);
    }),
    release: jest.fn(),
  };
  return { connect: jest.fn(async () => client), __client: client, __consultas: consultas };
});

const db = require('../config/db');
const { withTransaction } = require('../repositories/transaccion');

beforeEach(() => {
  db.__consultas.length = 0;
});

test('éxito → BEGIN, consultas, COMMIT y libera la conexión', async () => {
  const resultado = await withTransaction(async (client) => {
    await client.query('INSERT 1');
    await client.query('INSERT 2');
    return 'ok';
  });
  expect(resultado).toBe('ok');
  expect(db.__consultas).toEqual(['BEGIN', 'INSERT 1', 'INSERT 2', 'COMMIT']);
  expect(db.__client.release).toHaveBeenCalled();
});

test('error → ROLLBACK, libera la conexión y relanza el error', async () => {
  await expect(
    withTransaction(async (client) => {
      await client.query('DELETE permisos');
      throw new Error('falla en el INSERT');
    }),
  ).rejects.toThrow('falla en el INSERT');
  expect(db.__consultas).toEqual(['BEGIN', 'DELETE permisos', 'ROLLBACK']);
  expect(db.__client.release).toHaveBeenCalled();
});
