const AppError = require('../utils/AppError');
const db = require('../config/db');
const Dashboard = require('../models/Dashboard');
const permisoService = require('./permisoService');

const SELECT_DASHBOARDS = `
  SELECT d.*, s.nombre_sm, m.nombre_m
    FROM dashboards d
    LEFT JOIN submodulos s ON d.submodulos_id_sm = s.id_sm
    LEFT JOIN modulos m ON s.modulos_id_m = m.id_m`;

const dashboardService = {

  // Admin ve todo; user solo los dashboards permitidos.
  async listar(usuario) {
    if (permisoService.esAdmin(usuario)) {
      const result = await db.query(`${SELECT_DASHBOARDS} ORDER BY d.id_d`);
      return result.rows.map(row => new Dashboard(row).toJSON());
    }
    const ids = await permisoService.dashboardsAccesibles(usuario.id);
    const result = await db.query(
      `${SELECT_DASHBOARDS} WHERE d.id_d = ANY($1::int[]) ORDER BY d.id_d`,
      [ids]
    );
    return result.rows.map(row => new Dashboard(row).toJSON());
  },

  // El acceso ya fue validado por checkPermission('dashboard').
  async obtener(id) {
    const result = await db.query(`${SELECT_DASHBOARDS} WHERE d.id_d = $1`, [id]);
    if (result.rows.length === 0) throw new AppError(404, 'Dashboard no encontrado');
    return new Dashboard(result.rows[0]).toJSON();
  },

  // Dashboards de un submódulo que el usuario puede ver.
  // El acceso al submódulo ya fue validado por checkPermission('submodulo').
  async listarPorSubmodulo(idSubmodulo, usuario) {
    if (permisoService.esAdmin(usuario)) {
      const result = await db.query(
        `${SELECT_DASHBOARDS} WHERE d.submodulos_id_sm = $1 ORDER BY d.id_d`,
        [idSubmodulo]
      );
      return result.rows.map(row => new Dashboard(row).toJSON());
    }
    const ids = await permisoService.dashboardsAccesibles(usuario.id);
    const result = await db.query(
      `${SELECT_DASHBOARDS} WHERE d.submodulos_id_sm = $1 AND d.id_d = ANY($2::int[]) ORDER BY d.id_d`,
      [idSubmodulo, ids]
    );
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
    if (result.rows.length === 0) throw AppError.notFound('Dashboard no encontrado');
    return new Dashboard(result.rows[0]).toJSON();
  }

};

module.exports = dashboardService;
