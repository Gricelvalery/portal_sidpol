const db = require('../config/db');
const Modulo = require('../models/Modulo');

const moduloService = {

  async listar() {
    const result = await db.query(`
      SELECT m.*, a.nombre_area 
      FROM modulos m
      LEFT JOIN area a ON m.id_area = a.id_area
      ORDER BY m.id_m
    `);
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