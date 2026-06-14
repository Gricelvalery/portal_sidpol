const submoduloService = require('../services/submoduloService');

const submoduloController = {

  async listar(req, res) {
    try {
      const submodulos = await submoduloService.listar();
      res.json(submodulos);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener submódulos' });
    }
  },

  async crear(req, res) {
    try {
      const submodulo = await submoduloService.crear(req.body);
      res.json(submodulo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear submódulo' });
    }
  },

  async actualizar(req, res) {
    try {
      const submodulo = await submoduloService.actualizar(req.params.id, req.body);
      res.json(submodulo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar submódulo' });
    }
  }

};

module.exports = submoduloController;