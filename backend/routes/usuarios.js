const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken } = require('../middlewares/auth');
const { checkRole } = require('../middlewares/permisos');
const {
  crearUsuarioValidator,
  actualizarUsuarioValidator,
  idUsuarioValidator,
  permisosValidator,
} = require('../validators/usuarioValidator');

// Solo un admin gestiona usuarios, roles y permisos
router.use(verificarToken, checkRole('admin'));

router.get('/', usuarioController.listar);
router.post('/', crearUsuarioValidator, usuarioController.crear);
router.put('/:id', actualizarUsuarioValidator, usuarioController.actualizar);
router.delete('/:id', idUsuarioValidator, usuarioController.eliminar);

router.get('/:id/permisos', idUsuarioValidator, usuarioController.obtenerPermisos);
router.post('/:id/permisos', permisosValidator, usuarioController.guardarPermisos);

module.exports = router;
