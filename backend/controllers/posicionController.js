const posicionService = require('../services/posicionService');

const posicionController = {
  async listar(req, res) {
    res.json(await posicionService.listar());
  },

  async crear(req, res) {
    res.status(201).json(await posicionService.crear(req.body));
  },
};

module.exports = posicionController;
