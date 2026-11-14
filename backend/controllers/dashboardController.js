const dashboardService = require('../services/dashboardService');

const dashboardController = {
  async listar(req, res) {
    res.json(await dashboardService.listar(req.usuario));
  },

  async obtener(req, res) {
    res.json(await dashboardService.obtener(Number(req.params.id)));
  },

  async listarPorSubmodulo(req, res) {
    res.json(await dashboardService.listarPorSubmodulo(Number(req.params.id), req.usuario));
  },

  async crear(req, res) {
    res.status(201).json(await dashboardService.crear(req.body));
  },

  async actualizar(req, res) {
    res.json(await dashboardService.actualizar(req.params.id, req.body));
  },
};

module.exports = dashboardController;
