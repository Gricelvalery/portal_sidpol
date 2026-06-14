const db = require('../config/db');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const Usuario = require('../models/Usuario');

const authService = {

  async login(username, contrasenia) {
    const result = await db.query(
      'SELECT * FROM usuario WHERE username = $1 AND contrasenia_u = $2',
      [username, contrasenia]
    );

    if (result.rows.length === 0) {
      throw { status: 401, message: 'Credenciales incorrectas' };
    }

    const userRow = result.rows[0];

    if (!userRow.autorizado) {
      throw { status: 403, message: 'Usuario no autorizado. Contacte al administrador.' };
    }

    const usuario = new Usuario(userRow);

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    const permisos = await this.obtenerPermisos(usuario.id);

    return {
      token,
      usuario: usuario.toJSON(),
      permisos
    };
  },

  async obtenerPermisos(userId) {
    const result = await db.query(`
      SELECT 
        p.dashboards_id_d,
        d.nombre_d,
        s.id_sm,
        s.nombre_sm,
        s.ruta,
        m.nombre_m
      FROM permisos p
      LEFT JOIN dashboards d 
        ON p.dashboards_id_d = d.id_d
      LEFT JOIN submodulos s 
        ON d.submodulos_id_sm = s.id_sm
      LEFT JOIN modulos m 
        ON s.modulos_id_m = m.id_m
      WHERE p.usuario_id_u = $1
    `, [userId]);

    return result.rows;
  }

};

module.exports = authService;