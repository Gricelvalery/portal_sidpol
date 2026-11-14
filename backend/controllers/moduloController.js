const moduloService = require('../services/moduloService');

const moduloController = {

  async listar(req, res) {
    res.json(await moduloService.listar(req.usuario));
  },

  async crear(req, res) {
    res.status(201).json(await moduloService.crear(req.body));
  },

  async actualizar(req, res) {
    res.json(await moduloService.actualizar(req.params.id, req.body));
  }

};

module.exports = moduloController;
