const moduloService = require('../services/moduloService');

const moduloController = {

  async listar(req, res) {
    try {
      const modulos = await moduloService.listar();
      res.json(modulos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener módulos' });
    }
  },

  async crear(req, res) {
    try {
      const modulo = await moduloService.crear(req.body);
      res.json(modulo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear módulo' });
    }
  },

  async actualizar(req, res) {
    try {
      const modulo = await moduloService.actualizar(req.params.id, req.body);
      res.json(modulo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar módulo' });
    }
  }

};

module.exports = moduloController;