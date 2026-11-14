const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const db = require('../config/db');

// Verifica el JWT (solo HS256, esquema Bearer) y lee rol/autorizado actuales en
// la BD, para que un cambio de rol, una desautorización o una eliminación
// apliquen de inmediato. Los errores de BD llegan al errorHandler (Express 5).
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

  const result = await db.query(
    'SELECT id_u, rol_u, autorizado FROM usuario WHERE id_u = $1',
    [decoded.id]
  );
  const fila = result.rows[0];
  if (!fila || !fila.autorizado) {
    return res.status(401).json({ error: 'Sesión no válida' });
  }

  req.usuario = { id: fila.id_u, rol: fila.rol_u };
  next();
};

module.exports = verificarToken;
