const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verificarToken } = require('../middlewares/auth');
const { checkRole, checkPermission } = require('../middlewares/permisos');
const { dashboardValidator, dashboardActualizarValidator } = require('../validators/catalogoValidator');

router.get('/', verificarToken, dashboardController.listar);
router.get('/:id', verificarToken, checkPermission('dashboard'), dashboardController.obtener);
router.post('/', verificarToken, checkRole('admin'), dashboardValidator, dashboardController.crear);
router.put('/:id', verificarToken, checkRole('admin'), dashboardActualizarValidator, dashboardController.actualizar);

module.exports = router;
