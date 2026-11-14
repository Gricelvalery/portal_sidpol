// Logger estructurado (JSON) con pino.
// Reglas: nunca se registran contraseñas, tokens, headers de autenticación ni el
// body de las peticiones (tampoco el del login).
const pino = require('pino');
const env = require('./env');

const CENSURA = '[REDACTADO]';

/** Campos que se tapan en cualquier objeto que llegue al log (defensa adicional). */
const CAMPOS_SENSIBLES = [
  'contrasenia',
  'contrasenia_u',
  'password',
  'token',
  'hash',
  'authorization',
  '*.contrasenia',
  '*.contrasenia_u',
  '*.password',
  '*.token',
  '*.hash',
  '*.authorization',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
];

/** Petición: solo método, ruta e id. Sin headers ni body. */
const serializarPeticion = (req) => ({
  id: req.id,
  method: req.method,
  url: req.originalUrl ?? req.url,
});

const serializarRespuesta = (res) => ({ statusCode: res.statusCode });

/**
 * Error: tipo, mensaje, código y stack. Se descarta err.detail de PostgreSQL
 * (puede contener valores de las filas, p. ej. "Key (correo_u)=(...)").
 */
const serializarError = (err) => {
  if (!err || typeof err !== 'object') return err;
  return {
    type: err.name || err.constructor?.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
  };
};

const serializadores = {
  req: serializarPeticion,
  res: serializarRespuesta,
  err: serializarError,
};

const opciones = {
  level: env.LOG_LEVEL,
  base: { app: 'sidpol-backend' },
  redact: { paths: CAMPOS_SENSIBLES, censor: CENSURA },
  serializers: serializadores,
};

/** pino-pretty solo si existe (dependencia de desarrollo) y estamos en desarrollo. */
function transporteLegible() {
  if (env.NODE_ENV !== 'development') return undefined;
  try {
    require.resolve('pino-pretty');
    return { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } };
  } catch {
    return undefined;
  }
}

/** Crea un logger con las reglas del proyecto. destino: stream opcional (pruebas). */
function crearLogger(destino) {
  if (destino) return pino(opciones, destino);
  const transport = transporteLegible();
  return transport ? pino({ ...opciones, transport }) : pino(opciones);
}

const logger = crearLogger();

module.exports = { logger, crearLogger, serializadores, CENSURA };
