const authService = require('../services/authService');

const authController = {

  async login(req, res) {
    const { username, contrasenia } = req.body;

    try {
      const data = await authService.login(username, contrasenia);
      res.json({ success: true, ...data });

    } catch (err) {
      // Errores controlados (credenciales, autorización)
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      // Errores inesperados
      console.error(err);
      res.status(500).json({ error: 'Error servidor' });
    }
  }

};

module.exports = authController;