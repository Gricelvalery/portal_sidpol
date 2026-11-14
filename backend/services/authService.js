const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const jwtConfig = require('../config/jwt');
const AppError = require('../utils/AppError');
const usuarioRepository = require('../repositories/usuarioRepository');

// Hash de relleno: si el usuario no existe igual se ejecuta un bcrypt.compare,
// así el tiempo de respuesta no revela qué usernames existen.
const HASH_RELLENO = bcrypt.hashSync('sidpol-usuario-inexistente', env.BCRYPT_COST);

const authService = {

  async login(username, contrasenia) {
    const credenciales = await usuarioRepository.buscarCredenciales(String(username).trim().toLowerCase());

    const valida = await bcrypt.compare(contrasenia, credenciales?.hash || HASH_RELLENO);
    if (!credenciales || !valida) {
      throw AppError.unauthorized('Credenciales incorrectas');
    }
    if (!credenciales.autorizado) {
      throw AppError.forbidden('Usuario no autorizado. Contacte al administrador.');
    }

    const { usuario } = credenciales;
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn, algorithm: jwtConfig.algorithm }
    );

    return { token, usuario };
  }

};

module.exports = authService;
