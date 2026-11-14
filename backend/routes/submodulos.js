const express = require('express');
const router = express.Router();
const submoduloController = require('../controllers/submoduloController');
const dashboardController = require('../controllers/dashboardController');
const verificarToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');
const checkPermission = require('../middlewares/checkPermission');
const { submoduloValidator } = require('../validators/catalogoValidator');

router.get('/', verificarToken, submoduloController.listar);
router.get('/:id/dashboards', verificarToken, checkPermission('submodulo'), dashboardController.listarPorSubmodulo);
router.post('/', verificarToken, checkRole('admin'), submoduloValidator, submoduloController.crear);
router.put('/:id', verificarToken, checkRole('admin'), submoduloValidator, submoduloController.actualizar);

module.exports = router;
