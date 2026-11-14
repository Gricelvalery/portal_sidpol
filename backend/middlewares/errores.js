const AppError = require('../utils/AppError');

// Códigos de PostgreSQL que se traducen a un mensaje genérico (sin nombres de tablas/columnas)
const ERRORES_PG = {
  23505: [409, 'El registro ya existe'],
  23503: [409, 'El registro está en uso o referencia un dato inexistente'],
  23502: [400, 'Falta un dato obligatorio'],
  '22P02': [400, 'Dato inválido'],
  22001: [400, 'Valor demasiado largo'],
  22003: [400, 'Número fuera de rango'],
};

/** 404 en JSON para rutas que no existen. */
const notFound = (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
};

/** Manejo centralizado de errores: nunca expone mensajes internos ni de la BD. */
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Errores del parser de JSON (express.json)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Petición demasiado grande' });
  }
  if (err.type && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: 'Petición inválida' });
  }

  if (err.code && ERRORES_PG[err.code]) {
    const [status, mensaje] = ERRORES_PG[err.code];
    console.warn(`[BD ${err.code}] ${req.method} ${req.originalUrl}: ${err.message}`);
    return res.status(status).json({ error: mensaje });
  }

  // Inesperado: el detalle queda solo en el log del servidor
  console.error(`[500] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: 'Error interno' });
};

module.exports = { notFound, errorHandler };
