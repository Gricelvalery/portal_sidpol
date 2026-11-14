const authService = require('../services/authService');

const authController = {

  async login(req, res) {
    const { username, contrasenia } = req.body;
    const data = await authService.login(username, contrasenia);
    res.json({ success: true, ...data });
  }

};

module.exports = authController;
