const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const db = require('../config/db');

// Verifica el JWT y además lee rol/autorizado actuales en la BD, para que un
// cambio de rol, una desautorización o una eliminación apliquen de inmediato.
const verificarToken = async (req, res, next) => {
  const [esquema, token] = (req.headers['authorization'] || '').split(' ');

  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtConfig.secret, { algorithms: ['HS256'] });
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  try {
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
  } catch (err) {
    next(err);
  }
};

module.exports = verificarToken;
