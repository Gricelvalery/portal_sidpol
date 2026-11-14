const db = require('../config/db');
const Usuario = require('../models/Usuario');

// Todas las funciones aceptan un "ejecutor" opcional (el pool o el client de una transacción).

const SELECT_DETALLE = `
  SELECT u.id_u, u.nombres_u, u.apellido_paterno_u, u.apellido_materno_u, u.correo_u,
         u.rol_u, u.username, u.id_posicion, u.autorizado,
         p.nombre_posicion, a.nombre_area
    FROM usuario u
    LEFT JOIN posicion p ON u.id_posicion = p.id_posicion
    LEFT JOIN area a ON p.id_area = a.id_area`;

const usuarioRepository = {
  async listar(ejecutor = db) {
    const { rows } = await ejecutor.query(`${SELECT_DETALLE} ORDER BY u.id_u`);
    return rows.map((row) => new Usuario(row));
  },

  /** Para el login: el hash viaja aparte y nunca dentro del modelo. */
  async buscarCredenciales(username, ejecutor = db) {
    const { rows } = await ejecutor.query('SELECT * FROM usuario WHERE username = $1', [username]);
    if (rows.length === 0) return null;
    return {
      usuario: new Usuario(rows[0]),
      hash: rows[0].contrasenia_u,
      autorizado: rows[0].autorizado,
    };
  },

  /** Estado mínimo para autorización. Con bloquear=true toma la fila con FOR UPDATE. */
  async obtenerEstado(id, ejecutor = db, { bloquear = false } = {}) {
    const { rows } = await ejecutor.query(
      `SELECT id_u, rol_u, autorizado FROM usuario WHERE id_u = $1${bloquear ? ' FOR UPDATE' : ''}`,
      [id],
    );
    if (rows.length === 0) return null;
    return { id: rows[0].id_u, rol: rows[0].rol_u, autorizado: rows[0].autorizado };
  },

  /**
   * Bloquea (FOR UPDATE, en orden de id para evitar deadlocks) a los admins
   * autorizados y devuelve sus ids. Debe usarse dentro de una transacción.
   */
  async bloquearAdminsAutorizados(ejecutor) {
    const { rows } = await ejecutor.query(
      `SELECT id_u FROM usuario WHERE rol_u = 'admin' AND autorizado ORDER BY id_u FOR UPDATE`,
    );
    return rows.map((r) => r.id_u);
  },

  /** Usernames ocupados que empiezan con el prefijo (también vía correo). Una sola consulta. */
  async usernamesConPrefijo(prefijo, ejecutor = db) {
    const { rows } = await ejecutor.query(
      `SELECT username AS nombre FROM usuario WHERE username LIKE $1 || '%'
       UNION
       SELECT split_part(correo_u, '@', 1) FROM usuario WHERE correo_u LIKE $1 || '%'`,
      [prefijo],
    );
    return new Set(rows.map((r) => r.nombre));
  },

  async insertar(datos, ejecutor = db) {
    const { rows } = await ejecutor.query(
      `
      INSERT INTO usuario (nombres_u, apellido_paterno_u, apellido_materno_u, correo_u,
                           contrasenia_u, rol_u, id_posicion, username, autorizado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        datos.nombres_u,
        datos.apellido_paterno_u,
        datos.apellido_materno_u,
        datos.correo_u,
        datos.contrasenia_u,
        datos.rol_u,
        datos.id_posicion,
        datos.username,
        datos.autorizado,
      ],
    );
    return new Usuario(rows[0]);
  },

  /** No toca username, correo ni contraseña. */
  async actualizar(id, datos, ejecutor = db) {
    const { rows } = await ejecutor.query(
      `
      UPDATE usuario
         SET nombres_u = $1, apellido_paterno_u = $2, apellido_materno_u = $3,
             rol_u = $4, id_posicion = $5, autorizado = $6
       WHERE id_u = $7 RETURNING *`,
      [
        datos.nombres_u,
        datos.apellido_paterno_u,
        datos.apellido_materno_u,
        datos.rol_u,
        datos.id_posicion,
        datos.autorizado,
        id,
      ],
    );
    return rows.length ? new Usuario(rows[0]) : null;
  },

  async eliminar(id, ejecutor = db) {
    const { rowCount } = await ejecutor.query('DELETE FROM usuario WHERE id_u = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = usuarioRepository;
