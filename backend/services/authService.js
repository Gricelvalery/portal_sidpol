const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const Usuario = require('../models/Usuario');

// Hash de relleno: si el usuario no existe igual se ejecuta un bcrypt.compare,
// así el tiempo de respuesta no revela qué usernames existen.
const HASH_RELLENO = bcrypt.hashSync('sidpol-usuario-inexistente', 12);

const authService = {

  async login(username, contrasenia) {
    const result = await db.query(
      'SELECT * FROM usuario WHERE username = $1',
      [String(username).trim().toLowerCase()]
    );
    const userRow = result.rows[0];

    const valida = await bcrypt.compare(contrasenia, userRow?.contrasenia_u || HASH_RELLENO);
    if (!userRow || !valida) {
      throw { status: 401, message: 'Credenciales incorrectas' };
    }

    if (!userRow.autorizado) {
      throw { status: 403, message: 'Usuario no autorizado. Contacte al administrador.' };
    }

    const usuario = new Usuario(userRow);
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn, algorithm: 'HS256' }
    );

    return { token, usuario: usuario.toJSON() };
  }

};

module.exports = authService;
