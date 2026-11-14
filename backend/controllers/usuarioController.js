const usuarioService = require('../services/usuarioService');

const usuarioController = {

  async listar(req, res) {
    res.json(await usuarioService.listar());
  },

  async crear(req, res) {
    const usuario = await usuarioService.crear(req.body);
    res.status(201).json({ success: true, usuario });
  },

  async actualizar(req, res) {
    const usuario = await usuarioService.actualizar(req.params.id, req.body, req.usuario);
    res.json({ success: true, usuario });
  },

  async eliminar(req, res) {
    await usuarioService.eliminar(req.params.id, req.usuario);
    res.json({ success: true });
  },

  async obtenerPermisos(req, res) {
    res.json(await usuarioService.obtenerPermisos(req.params.id));
  },

  async guardarPermisos(req, res) {
    await usuarioService.guardarPermisos(req.params.id, req.body);
    res.json({ success: true, message: 'Permisos guardados' });
  }

};

module.exports = usuarioController;
