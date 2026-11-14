const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const verificarToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');
const { areaValidator, areaActualizarValidator } = require('../validators/catalogoValidator');

router.get('/', verificarToken, areaController.listar);
router.post('/', verificarToken, checkRole('admin'), areaValidator, areaController.crear);
router.put('/:id', verificarToken, checkRole('admin'), areaActualizarValidator, areaController.actualizar);

module.exports = router;
