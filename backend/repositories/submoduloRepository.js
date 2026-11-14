const db = require('../config/db');
const Submodulo = require('../models/Submodulo');

const SELECT_SUBMODULOS = `
  SELECT s.*, m.nombre_m
    FROM submodulos s
    LEFT JOIN modulos m ON s.modulos_id_m = m.id_m`;

const submoduloRepository = {
  /** Sin filtro: todos. Con ids: solo esos (lista vacía → ninguno). */
  async listar({ ids } = {}, ejecutor = db) {
    if (!ids) {
      const { rows } = await ejecutor.query(`${SELECT_SUBMODULOS} ORDER BY s.id_sm`);
      return rows.map((row) => new Submodulo(row));
    }
    const { rows } = await ejecutor.query(
      `${SELECT_SUBMODULOS} WHERE s.id_sm = ANY($1::int[]) ORDER BY s.id_sm`,
      [ids],
    );
    return rows.map((row) => new Submodulo(row));
  },

  async insertar({ nombre_sm, descripcion_sm, modulos_id_m }, ejecutor = db) {
    const { rows } = await ejecutor.query(
      'INSERT INTO submodulos (nombre_sm, descripcion_sm, modulos_id_m) VALUES ($1, $2, $3) RETURNING *',
      [nombre_sm, descripcion_sm, modulos_id_m],
    );
    return new Submodulo(rows[0]);
  },

  async actualizar(id, { nombre_sm, descripcion_sm, modulos_id_m }, ejecutor = db) {
    const { rows } = await ejecutor.query(
      'UPDATE submodulos SET nombre_sm=$1, descripcion_sm=$2, modulos_id_m=$3 WHERE id_sm=$4 RETURNING *',
      [nombre_sm, descripcion_sm, modulos_id_m, id],
    );
    return rows.length ? new Submodulo(rows[0]) : null;
  },
};

module.exports = submoduloRepository;
