const permisoService = require('../services/permisoService');

/**
 * Autorización por rol.
 * Uso: router.post('/', verificarToken, checkRole('admin'), ...)
 */
const checkRole = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({ error: 'No tienes permisos para esta acción' });
  }
  next();
};

/**
 * Autorización por recurso ('submodulo' | 'dashboard'). Admin siempre pasa.
 * Uso: router.get('/:id/dashboards', verificarToken, checkPermission('submodulo'), ...)
 */
const checkPermission = (tipo, param = 'id') => async (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  const id = Number(req.params[param]);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identificador inválido' });
  }

  if (!(await permisoService.tieneAcceso(req.usuario, tipo, id))) {
    return res.status(403).json({ error: 'No tienes acceso a este recurso' });
  }
  next();
};

module.exports = { checkRole, checkPermission };
