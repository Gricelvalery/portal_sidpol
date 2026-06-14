const db = require('../config/db');
const Posicion = require('../models/Posicion');

const posicionService = {

  async listar() {
    const result = await db.query(`
      SELECT p.*, a.nombre_area 
      FROM posicion p
      JOIN area a ON p.id_area = a.id_area
      ORDER BY p.id_posicion
    `);
    return result.rows.map(row => new Posicion(row).toJSON());
  },

  async crear(datos) {
    const { nombre_posicion, descripcion_p, id_area } = datos;
    const result = await db.query(
      'INSERT INTO posicion (nombre_posicion, descripcion_p, id_area) VALUES ($1, $2, $3) RETURNING *',
      [nombre_posicion, descripcion_p, id_area]
    );
    return new Posicion(result.rows[0]).toJSON();
  }

};

module.exports = posicionService;