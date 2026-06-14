const db = require('../config/db');
const Area = require('../models/Area');

const areaService = {

  async listar() {
    const result = await db.query('SELECT * FROM area ORDER BY id_area');
    return result.rows.map(row => new Area(row).toJSON());
  },

  async crear(datos) {
    const { nombre_area, descripcion_area } = datos;
    const result = await db.query(
      'INSERT INTO area (nombre_area, descripcion_area) VALUES ($1, $2) RETURNING *',
      [nombre_area, descripcion_area]
    );
    return new Area(result.rows[0]).toJSON();
  },

  async actualizar(id, datos) {
    const { nombre_area, descripcion_area } = datos;
    const result = await db.query(
      'UPDATE area SET nombre_area=$1, descripcion_area=$2 WHERE id_area=$3 RETURNING *',
      [nombre_area, descripcion_area, id]
    );
    return new Area(result.rows[0]).toJSON();
  }

};

module.exports = areaService;