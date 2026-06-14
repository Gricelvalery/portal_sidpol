const usuarioService = require('../services/usuarioService');

const usuarioController = {

  async listar(req, res) {
    try {
      const usuarios = await usuarioService.listar();
      res.json(usuarios);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async crear(req, res) {
    try {
      const usuario = await usuarioService.crear(req.body);
      res.json({ success: true, usuario });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  },

  async actualizar(req, res) {
    try {
      const usuario = await usuarioService.actualizar(req.params.id, req.body);
      res.json({ success: true, usuario });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  },

  async eliminar(req, res) {
    try {
      await usuarioService.eliminar(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async obtenerPermisos(req, res) {
    try {
      const permisos = await usuarioService.obtenerPermisos(req.params.id);
      res.json(permisos);
    } catch (err) {
      console.error('Error permisos:', err.message);
      res.json([]); // mantiene el comportamiento original
    }
  },

  async guardarPermisos(req, res) {
    try {
      await usuarioService.guardarPermisos(req.params.id, req.body.dashboards_ids);
      res.json({ success: true, message: 'Permisos guardados' });
    } catch (err) {
      console.error('ERROR GUARDAR PERMISOS:', err);
      res.status(500).json({ error: err.message });
    }
  }

};

module.exports = usuarioController;