const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const env = require('../config/env');

const QUINCE_MIN = 15 * 60 * 1000;

const responder429 = (mensaje) => (req, res) => res.status(429).json({ error: mensaje });

const base = {
  windowMs: QUINCE_MIN,
  standardHeaders: 'draft-8',
  legacyHeaders: false
};

// Límite general para toda la API, por IP
const limiterApi = rateLimit({
  ...base,
  limit: env.RATE_LIMIT_API,
  handler: responder429('Demasiadas peticiones. Intenta de nuevo en unos minutos.')
});

// Login: RATE_LIMIT_LOGIN (5) intentos FALLIDOS por IP + username (un agente que
// se equivoca no bloquea a toda la comisaría que comparte la misma IP pública)
const limiterLoginUsuario = rateLimit({
  ...base,
  limit: env.RATE_LIMIT_LOGIN,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const username = String(req.body?.username ?? '').trim().toLowerCase().slice(0, 80);
    return `${ipKeyGenerator(req.ip)}|${username}`;
  },
  handler: responder429('Demasiados intentos. Intenta de nuevo en unos minutos.')
});

// Login: tope por IP sin importar el username (evita probar muchos usuarios)
const limiterLoginIp = rateLimit({
  ...base,
  limit: 30,
  handler: responder429('Demasiados intentos. Intenta de nuevo en unos minutos.')
});

module.exports = { limiterApi, limiterLoginUsuario, limiterLoginIp };
