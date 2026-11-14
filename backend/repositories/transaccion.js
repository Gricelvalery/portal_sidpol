const db = require('../config/db');

/**
 * Ejecuta fn(client) dentro de una transacción.
 * COMMIT si fn termina bien; ROLLBACK si lanza (y se relanza el error).
 * Los repositorios reciben ese client como "ejecutor" para participar en ella.
 */
async function withTransaction(fn) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch { /* la conexión pudo haberse caído */ }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { withTransaction };
