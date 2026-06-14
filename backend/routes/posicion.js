const express = require('express');
const router = express.Router();
const posicionController = require('../controllers/posicionController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');
const { posicionValidator } = require('../validators/catalogoValidator');

router.get('/', verificarToken, posicionController.listar);
router.post('/', verificarToken, verificarRol('Admin'), posicionValidator, posicionController.crear);

module.exports = router;