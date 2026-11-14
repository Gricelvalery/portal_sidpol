const db = require('../config/db');
const Modulo = require('../models/Modulo');
const permisoService = require('./permisoService');

const SELECT_MODULOS = `
  SELECT m.*, a.nombre_area
    FROM modulos m
    LEFT JOIN area a ON m.id_area = a.id_area`;

const moduloService = {

  // Admin ve todo; user solo los módulos que contienen algún submódulo accesible.
  async listar(usuario) {
    if (permisoService.esAdmin(usuario)) {
      const result = await db.query(`${SELECT_MODULOS} ORDER BY m.id_m`);
      return result.rows.map(row => new Modulo(row).toJSON());
    }
    const ids = await permisoService.submodulosAccesibles(usuario.id);
    const result = await db.query(`
      ${SELECT_MODULOS}
       WHERE m.id_m IN (SELECT s.modulos_id_m FROM submodulos s WHERE s.id_sm = ANY($1::int[]))
       ORDER BY m.id_m`,
      [ids]
    );
    return result.rows.map(row => new Modulo(row).toJSON());
  },

  async crear(datos) {
    const { nombre_m, descripcion_m, id_area } = datos;
    const result = await db.query(
      'INSERT INTO modulos (nombre_m, descripcion_m, id_area) VALUES ($1, $2, $3) RETURNING *',
      [nombre_m, descripcion_m, id_area]
    );
    return new Modulo(result.rows[0]).toJSON();
  },

  async actualizar(id, datos) {
    const { nombre_m, descripcion_m, id_area } = datos;
    const result = await db.query(
      'UPDATE modulos SET nombre_m=$1, descripcion_m=$2, id_area=$3 WHERE id_m=$4 RETURNING *',
      [nombre_m, descripcion_m, id_area, id]
    );
    return new Modulo(result.rows[0]).toJSON();
  }

};

module.exports = moduloService;
