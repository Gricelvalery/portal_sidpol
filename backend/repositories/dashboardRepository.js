const db = require('../config/db');
const Dashboard = require('../models/Dashboard');

const SELECT_DASHBOARDS = `
  SELECT d.*, s.nombre_sm, m.nombre_m
    FROM dashboards d
    LEFT JOIN submodulos s ON d.submodulos_id_sm = s.id_sm
    LEFT JOIN modulos m ON s.modulos_id_m = m.id_m`;

const dashboardRepository = {
  /**
   * Filtros opcionales:
   *  - idSubmodulo: solo los de ese submódulo.
   *  - ids: solo esos dashboards (lista vacía → ninguno).
   */
  async listar({ idSubmodulo, ids } = {}, ejecutor = db) {
    const condiciones = [];
    const params = [];
    if (idSubmodulo !== undefined) {
      params.push(idSubmodulo);
      condiciones.push(`d.submodulos_id_sm = $${params.length}`);
    }
    if (ids) {
      params.push(ids);
      condiciones.push(`d.id_d = ANY($${params.length}::int[])`);
    }
    const where = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
    const { rows } = await ejecutor.query(`${SELECT_DASHBOARDS}${where} ORDER BY d.id_d`, params);
    return rows.map((row) => new Dashboard(row));
  },

  async obtener(id, ejecutor = db) {
    const { rows } = await ejecutor.query(`${SELECT_DASHBOARDS} WHERE d.id_d = $1`, [id]);
    return rows.length ? new Dashboard(rows[0]) : null;
  },

  async insertar({ nombre_d, link_d, submodulos_id_sm, paginas }, ejecutor = db) {
    const { rows } = await ejecutor.query(
      'INSERT INTO dashboards (nombre_d, link_d, submodulos_id_sm, paginas) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre_d, link_d, submodulos_id_sm, JSON.stringify(paginas || [])],
    );
    return new Dashboard(rows[0]);
  },

  async actualizar(id, { nombre_d, link_d, submodulos_id_sm, paginas }, ejecutor = db) {
    const { rows } = await ejecutor.query(
      'UPDATE dashboards SET nombre_d=$1, link_d=$2, submodulos_id_sm=$3, paginas=$4 WHERE id_d=$5 RETURNING *',
      [nombre_d, link_d, submodulos_id_sm, JSON.stringify(paginas || []), id],
    );
    return rows.length ? new Dashboard(rows[0]) : null;
  },
};

module.exports = dashboardRepository;
