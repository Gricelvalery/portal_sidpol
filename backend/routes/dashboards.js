const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');
const { dashboardValidator } = require('../validators/catalogoValidator');

router.get('/', verificarToken, dashboardController.listar);
router.post('/', verificarToken, verificarRol('Admin'), dashboardValidator, dashboardController.crear);
router.put('/:id', verificarToken, verificarRol('Admin'), dashboardValidator, dashboardController.actualizar);

module.exports = router;