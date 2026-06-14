const express = require('express');
const router = express.Router();
const moduloController = require('../controllers/moduloController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');
const { moduloValidator } = require('../validators/catalogoValidator');

router.get('/', verificarToken, moduloController.listar);
router.post('/', verificarToken, verificarRol('Admin'), moduloValidator, moduloController.crear);
router.put('/:id', verificarToken, verificarRol('Admin'), moduloValidator, moduloController.actualizar);

module.exports = router;