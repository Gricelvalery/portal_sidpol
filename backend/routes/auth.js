const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginValidator } = require('../validators/authValidator');
const { limiterLoginIp, limiterLoginUsuario } = require('../middlewares/rateLimit');

router.post('/login', limiterLoginIp, limiterLoginUsuario, loginValidator, authController.login);

module.exports = router;
