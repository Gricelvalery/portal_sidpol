const db = require('../config/db');
const Area = require('../models/Area');

const areaRepository = {

  async listar(ejecutor = db) {
    const { rows } = await ejecutor.query('SELECT * FROM area ORDER BY id_area');
    return rows.map(row => new Area(row));
  },

  async insertar({ nombre_area, descripcion_area }, ejecutor = db) {
    const { rows } = await ejecutor.query(
      'INSERT INTO area (nombre_area, descripcion_area) VALUES ($1, $2) RETURNING *',
      [nombre_area, descripcion_area]
    );
    return new Area(rows[0]);
  },

  async actualizar(id, { nombre_area, descripcion_area }, ejecutor = db) {
    const { rows } = await ejecutor.query(
      'UPDATE area SET nombre_area=$1, descripcion_area=$2 WHERE id_area=$3 RETURNING *',
      [nombre_area, descripcion_area, id]
    );
    return rows.length ? new Area(rows[0]) : null;
  }

};

module.exports = areaRepository;
