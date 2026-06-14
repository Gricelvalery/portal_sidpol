const areaService = require('../services/areaService');

const areaController = {

  async listar(req, res) {
    try {
      const areas = await areaService.listar();
      res.json(areas);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener áreas' });
    }
  },

  async crear(req, res) {
    try {
      const area = await areaService.crear(req.body);
      res.json(area);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear área' });
    }
  },

  async actualizar(req, res) {
    try {
      const area = await areaService.actualizar(req.params.id, req.body);
      res.json(area);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar área' });
    }
  }

};

module.exports = areaController;