const express = require('express');
const router = express.Router();
const moduloController = require('../controllers/moduloController');
const verificarToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');
const { moduloValidator, moduloActualizarValidator } = require('../validators/catalogoValidator');

router.get('/', verificarToken, moduloController.listar);
router.post('/', verificarToken, checkRole('admin'), moduloValidator, moduloController.crear);
router.put('/:id', verificarToken, checkRole('admin'), moduloActualizarValidator, moduloController.actualizar);

module.exports = router;
