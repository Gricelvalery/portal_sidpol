const express = require('express');
const router = express.Router();
const submoduloController = require('../controllers/submoduloController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');
const { submoduloValidator } = require('../validators/catalogoValidator');

router.get('/', verificarToken, submoduloController.listar);
router.post('/', verificarToken, verificarRol('Admin'), submoduloValidator, submoduloController.crear);
router.put('/:id', verificarToken, verificarRol('Admin'), submoduloValidator, submoduloController.actualizar);

module.exports = router;