const { Pool } = require('pg');
const env = require('./env');
const { logger } = require('./logger');

const db = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  ssl: { rejectUnauthorized: false }, // TODO (S8): usar el certificado CA de Supabase
});

// Un cliente inactivo que se cae no debe tumbar el proceso
db.on('error', (err) => logger.error({ err }, 'Error en el pool de BD'));

// Comprueba la conexión sin retener un cliente del pool
db.verificarConexion = async () => {
  try {
    await db.query('SELECT 1');
    logger.info('Conectado a la base de datos');
  } catch (err) {
    logger.error({ err }, 'No se pudo conectar a la base de datos');
  }
};

module.exports = db;
