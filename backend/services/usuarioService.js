const db = require('../config/db');
const Usuario = require('../models/Usuario');
const Permiso = require('../models/Permiso');

function generarUsername(nombre, apellido) {
  return `${nombre}.${apellido}`.toLowerCase().replace(/\s+/g, '');
}

const usuarioService = {

  async listar() {
    const result = await db.query(`
      SELECT u.id_u, u.nombre_u, u.apellido_u, u.correo_u, 
             u.rol_u, u.username, u.id_posicion, u.autorizado,
             p.nombre_posicion, a.nombre_area
      FROM usuario u
      LEFT JOIN posicion p ON u.id_posicion = p.id_posicion
      LEFT JOIN area a ON p.id_area = a.id_area
      ORDER BY u.id_u
    `);
    return result.rows.map(row => new Usuario(row).toJSON());
  },

  async crear(datos) {
    const { nombre_u, apellido_u, correo_u, contrasenia_u, rol_u, id_posicion, autorizado } = datos;
    const username = generarUsername(nombre_u, apellido_u);

    const existe = await db.query('SELECT id_u FROM usuario WHERE username = $1', [username]);
    if (existe.rows.length > 0) {
      throw { status: 400, message: `El usuario ${username} ya existe` };
    }

    const result = await db.query(`
      INSERT INTO usuario (nombre_u, apellido_u, correo_u, contrasenia_u, rol_u, id_posicion, username, autorizado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nombre_u, apellido_u, correo_u, contrasenia_u, rol_u, id_posicion, username, autorizado || false]
    );

    return new Usuario(result.rows[0]).toJSON();
  },

  async actualizar(id, datos) {
    const { nombre_u, apellido_u, correo_u, rol_u, id_posicion, autorizado } = datos;
    const username = generarUsername(nombre_u, apellido_u);

    const existe = await db.query(
      'SELECT id_u FROM usuario WHERE username = $1 AND id_u <> $2',
      [username, id]
    );

    if (existe.rows.length > 0) {
      throw { status: 400, message: `El usuario ${username} ya existe` };
    }

    const result = await db.query(`
      UPDATE usuario 
      SET nombre_u=$1, apellido_u=$2, correo_u=$3, rol_u=$4, id_posicion=$5, autorizado=$6, username=$7
      WHERE id_u=$8 RETURNING *`,
      [nombre_u, apellido_u, correo_u, rol_u, id_posicion, autorizado, username, id]
    );

    return new Usuario(result.rows[0]).toJSON();
  },

  async eliminar(id) {
    // Primero elimina los permisos del usuario
    await db.query('DELETE FROM permisos WHERE usuario_id_u = $1', [id]);
    // Luego elimina el usuario
    await db.query('DELETE FROM usuario WHERE id_u = $1', [id]);
    return true;
  },

  async obtenerPermisos(id) {
    const result = await db.query(`
      SELECT 
        p.id_p,
        p.dashboards_id_d,
        d.nombre_d,
        s.nombre_sm,
        m.nombre_m
      FROM permisos p
      JOIN dashboards d 
        ON p.dashboards_id_d = d.id_d
      JOIN submodulos s 
        ON d.submodulos_id_sm = s.id_sm
      JOIN modulos m 
        ON s.modulos_id_m = m.id_m
      WHERE p.usuario_id_u = $1
    `, [id]);

    return result.rows.map(row => new Permiso(row).toJSON());
  },

  async guardarPermisos(id, dashboardsIds) {
    await db.query('DELETE FROM permisos WHERE usuario_id_u = $1', [id]);

    for (const id_d of (dashboardsIds || [])) {
      await db.query(
        `INSERT INTO permisos (usuario_id_u, dashboards_id_d) VALUES ($1, $2)`,
        [id, id_d]
      );
    }

    return true;
  }

};

module.exports = usuarioService;