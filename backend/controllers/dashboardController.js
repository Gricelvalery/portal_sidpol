const dashboardService = require('../services/dashboardService');

const dashboardController = {

  async listar(req, res) {
    try {
      const dashboards = await dashboardService.listar(req.usuario);
      res.json(dashboards);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener dashboards' });
    }
  },

  async obtener(req, res) {
    try {
      res.json(await dashboardService.obtener(Number(req.params.id)));
    } catch (err) {
      if (err.status) return res.status(err.status).json({ error: err.message });
      console.error(err);
      res.status(500).json({ error: 'Error al obtener dashboard' });
    }
  },

  async listarPorSubmodulo(req, res) {
    try {
      res.json(await dashboardService.listarPorSubmodulo(Number(req.params.id), req.usuario));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener dashboards' });
    }
  },

  async crear(req, res) {
    try {
      const dashboard = await dashboardService.crear(req.body);
      res.json(dashboard);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al crear dashboard' });
    }
  },

  async actualizar(req, res) {
    try {
      const dashboard = await dashboardService.actualizar(req.params.id, req.body);
      res.json(dashboard);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar dashboard' });
    }
  }

};

module.exports = dashboardController;