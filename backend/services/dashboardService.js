const db = require('../config/db');
const Dashboard = require('../models/Dashboard');

const dashboardService = {

  async listar() {
    const result = await db.query(`
      SELECT d.*, s.nombre_sm, m.nombre_m
      FROM dashboards d
      LEFT JOIN submodulos s ON d.submodulos_id_sm = s.id_sm
      LEFT JOIN modulos m ON s.modulos_id_m = m.id_m
      ORDER BY d.id_d
    `);
    return result.rows.map(row => new Dashboard(row).toJSON());
  },

  async crear(datos) {
    const { nombre_d, link_d, submodulos_id_sm, paginas } = datos;
    const result = await db.query(
      'INSERT INTO dashboards (nombre_d, link_d, submodulos_id_sm, paginas) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre_d, link_d, submodulos_id_sm, JSON.stringify(paginas || [])]
    );
    return new Dashboard(result.rows[0]).toJSON();
  },

  async actualizar(id, datos) {
    const { nombre_d, link_d, submodulos_id_sm, paginas } = datos;
    const result = await db.query(
      'UPDATE dashboards SET nombre_d=$1, link_d=$2, submodulos_id_sm=$3, paginas=$4 WHERE id_d=$5 RETURNING *',
      [nombre_d, link_d, submodulos_id_sm, JSON.stringify(paginas || []), id]
    );
    return new Dashboard(result.rows[0]).toJSON();
  }

};

module.exports = dashboardService;