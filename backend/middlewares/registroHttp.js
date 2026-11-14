const { randomUUID } = require('crypto');
const pinoHttp = require('pino-http');
const { serializadores } = require('../config/logger');

/**
 * Registro de cada petición HTTP: método, ruta, estado, duración e id de usuario.
 * No registra headers ni body (ver serializadores en config/logger.js).
 * Expone req.log para que el resto de la app registre con el mismo id de petición.
 */
function crearRegistroHttp(logger) {
  return pinoHttp({
    logger,
    // pino-http trae sus propios serializadores (que incluyen TODOS los headers y
    // err.detail). Se reemplazan por los del proyecto y reciben el objeto original.
    serializers: serializadores,
    wrapSerializers: false,
    genReqId: (req, res) => {
      const id = randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.originalUrl} → ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${req.originalUrl} → ${res.statusCode}`,
    // Id del usuario autenticado (lo deja el middleware de auth); nunca su token
    customProps: (req) => (req.usuario ? { usuario: req.usuario.id } : {}),
    autoLogging: { ignore: (req) => req.url.startsWith('/api/docs') },
  });
}

module.exports = { crearRegistroHttp };
