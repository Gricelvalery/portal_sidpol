const express = require('express');
const router = express.Router();
const submoduloController = require('../controllers/submoduloController');
const dashboardController = require('../controllers/dashboardController');
const { verificarToken } = require('../middlewares/auth');
const { checkRole, checkPermission } = require('../middlewares/permisos');
const {
  submoduloValidator,
  submoduloActualizarValidator,
} = require('../validators/catalogoValidator');

router.get('/', verificarToken, submoduloController.listar);
router.get(
  '/:id/dashboards',
  verificarToken,
  checkPermission('submodulo'),
  dashboardController.listarPorSubmodulo,
);
router.post('/', verificarToken, checkRole('admin'), submoduloValidator, submoduloController.crear);
router.put(
  '/:id',
  verificarToken,
  checkRole('admin'),
  submoduloActualizarValidator,
  submoduloController.actualizar,
);

module.exports = router;
