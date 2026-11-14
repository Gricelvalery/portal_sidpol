const usuarioService = require('../services/usuarioService');

// Errores controlados ({ status, message }) se devuelven tal cual;
// los inesperados se registran y responden genérico (no filtrar detalles de la BD).
function responderError(res, err, mensaje) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(mensaje + ':', err);
  res.status(500).json({ error: mensaje });
}

const usuarioController = {

  async listar(req, res) {
    try {
      res.json(await usuarioService.listar());
    } catch (err) {
      responderError(res, err, 'Error al obtener usuarios');
    }
  },

  async crear(req, res) {
    try {
      const usuario = await usuarioService.crear(req.body);
      res.status(201).json({ success: true, usuario });
    } catch (err) {
      responderError(res, err, 'Error al crear usuario');
    }
  },

  async actualizar(req, res) {
    try {
      const usuario = await usuarioService.actualizar(req.params.id, req.body, req.usuario);
      res.json({ success: true, usuario });
    } catch (err) {
      responderError(res, err, 'Error al actualizar usuario');
    }
  },

  async eliminar(req, res) {
    try {
      await usuarioService.eliminar(req.params.id, req.usuario);
      res.json({ success: true });
    } catch (err) {
      responderError(res, err, 'Error al eliminar usuario');
    }
  },

  async obtenerPermisos(req, res) {
    try {
      res.json(await usuarioService.obtenerPermisos(req.params.id));
    } catch (err) {
      responderError(res, err, 'Error al obtener permisos');
    }
  },

  async guardarPermisos(req, res) {
    try {
      await usuarioService.guardarPermisos(req.params.id, req.body);
      res.json({ success: true, message: 'Permisos guardados' });
    } catch (err) {
      responderError(res, err, 'Error al guardar permisos');
    }
  }

};

module.exports = usuarioController;
