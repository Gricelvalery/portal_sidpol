const db = require('../config/db');
const Posicion = require('../models/Posicion');

const posicionRepository = {
  async listar(ejecutor = db) {
    const { rows } = await ejecutor.query(`
      SELECT p.*, a.nombre_area
        FROM posicion p
        JOIN area a ON p.id_area = a.id_area
       ORDER BY p.id_posicion
    `);
    return rows.map((row) => new Posicion(row));
  },

  async insertar({ nombre_posicion, descripcion_p, id_area }, ejecutor = db) {
    const { rows } = await ejecutor.query(
      'INSERT INTO posicion (nombre_posicion, descripcion_p, id_area) VALUES ($1, $2, $3) RETURNING *',
      [nombre_posicion, descripcion_p, id_area],
    );
    return new Posicion(rows[0]);
  },
};

module.exports = posicionRepository;
