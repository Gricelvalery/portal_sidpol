const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');
const { areaValidator } = require('../validators/catalogoValidator');

router.get('/', verificarToken, areaController.listar);
router.post('/', verificarToken, verificarRol('Admin'), areaValidator, areaController.crear);
router.put('/:id', verificarToken, verificarRol('Admin'), areaValidator, areaController.actualizar);

module.exports = router;