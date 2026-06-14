const posicionService = require('../services/posicionService');

const posicionController = {

  async listar(req, res) {
    try {
      const posiciones = await posicionService.listar();
      res.json(posiciones);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async crear(req, res) {
    try {
      const posicion = await posicionService.crear(req.body);
      res.json(posicion);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

};

module.exports = posicionController;