const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const usuarioRepository = require('../repositories/usuarioRepository');

/**
 * Autenticación. Verifica el JWT (solo HS256, esquema "Bearer <token>") y lee el
 * rol/autorizado ACTUALES del usuario, para que un cambio de rol, una
 * desautorización o una eliminación apliquen de inmediato.
 * Deja en req.usuario = { id, rol }.
 */
const verificarToken = async (req, res, next) => {
  const [esquema, token, ...resto] = (req.headers['authorization'] || '').split(' ');

  if (esquema !== 'Bearer' || !token || resto.length > 0) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtConfig.secret, { algorithms: [jwtConfig.algorithm] });
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  const estado = await usuarioRepository.obtenerEstado(decoded.id);
  if (!estado || !estado.autorizado) {
    return res.status(401).json({ error: 'Sesión no válida' });
  }

  req.usuario = { id: estado.id, rol: estado.rol };
  next();
};

module.exports = { verificarToken };
