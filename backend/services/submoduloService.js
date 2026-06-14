const db = require('../config/db');
const Submodulo = require('../models/Submodulo');

const submoduloService = {

  async listar() {
  const result = await db.query(`
    SELECT s.*, m.nombre_m
    FROM submodulos s
    LEFT JOIN modulos m ON s.modulos_id_m = m.id_m
    ORDER BY s.id_sm
  `);
  return result.rows.map(row => new Submodulo(row).toJSON());
  },

  async crear(datos) {
    const { nombre_sm, descripcion_sm, modulos_id_m } = datos;
    const result = await db.query(
      'INSERT INTO submodulos (nombre_sm, descripcion_sm, modulos_id_m) VALUES ($1, $2, $3) RETURNING *',
      [nombre_sm, descripcion_sm, modulos_id_m]
    );
    return new Submodulo(result.rows[0]).toJSON();
  },

  async actualizar(id, datos) {
    const { nombre_sm, descripcion_sm, modulos_id_m } = datos;
    const result = await db.query(
      'UPDATE submodulos SET nombre_sm=$1, descripcion_sm=$2, modulos_id_m=$3 WHERE id_sm=$4 RETURNING *',
      [nombre_sm, descripcion_sm, modulos_id_m, id]
    );
    return new Submodulo(result.rows[0]).toJSON();
  }

};

module.exports = submoduloService;