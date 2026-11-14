const submoduloService = require('../services/submoduloService');

const submoduloController = {

  async listar(req, res) {
    res.json(await submoduloService.listar(req.usuario));
  },

  async crear(req, res) {
    res.status(201).json(await submoduloService.crear(req.body));
  },

  async actualizar(req, res) {
    res.json(await submoduloService.actualizar(req.params.id, req.body));
  }

};

module.exports = submoduloController;
