const areaService = require('../services/areaService');

// Sin try/catch: Express 5 envía las promesas rechazadas al errorHandler.
const areaController = {
  async listar(req, res) {
    res.json(await areaService.listar());
  },

  async crear(req, res) {
    res.status(201).json(await areaService.crear(req.body));
  },

  async actualizar(req, res) {
    res.json(await areaService.actualizar(req.params.id, req.body));
  },
};

module.exports = areaController;
