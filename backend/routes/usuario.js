const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middlewares/authMiddleware');
const verificarRol = require('../middlewares/roleMiddleware');
const { crearUsuarioValidator, actualizarUsuarioValidator } = require('../validators/usuarioValidator');

router.get('/', verificarToken, verificarRol('Admin'), usuarioController.listar);
router.post('/', verificarToken, verificarRol('Admin'), crearUsuarioValidator, usuarioController.crear);
router.put('/:id', verificarToken, verificarRol('Admin'), actualizarUsuarioValidator, usuarioController.actualizar);
router.delete('/:id', verificarToken, verificarRol('Admin'), usuarioController.eliminar);

router.get('/:id/permisos', verificarToken, verificarRol('Admin'), usuarioController.obtenerPermisos);
router.post('/:id/permisos', verificarToken, verificarRol('Admin'), usuarioController.guardarPermisos);

module.exports = router;