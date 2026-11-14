const express = require('express');
const router = express.Router();
const posicionController = require('../controllers/posicionController');
const verificarToken = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/checkRole');
const { posicionValidator } = require('../validators/catalogoValidator');

router.get('/', verificarToken, posicionController.listar);
router.post('/', verificarToken, checkRole('admin'), posicionValidator, posicionController.crear);

module.exports = router;