const permisoService = require('../services/permisoService');

// Uso: router.get('/:id/dashboards', verificarToken, checkPermission('submodulo'), ...)
// tipo: 'submodulo' | 'dashboard'. Admin siempre pasa.
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

module.exports = checkPermission;
