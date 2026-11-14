const db = require('../config/db');
const Modulo = require('../models/Modulo');

const SELECT_MODULOS = `
  SELECT m.*, a.nombre_area
    FROM modulos m
    LEFT JOIN area a ON m.id_area = a.id_area`;

const moduloRepository = {

  /**
   * Sin filtro: todos. Con idsSubmodulos: solo los módulos que contienen
   * alguno de esos submódulos (lista vacía → ninguno).
   */
  async listar({ idsSubmodulos } = {}, ejecutor = db) {
    if (!idsSubmodulos) {
      const { rows } = await ejecutor.query(`${SELECT_MODULOS} ORDER BY m.id_m`);
      return rows.map(row => new Modulo(row));
    }
    const { rows } = await ejecutor.query(`
      ${SELECT_MODULOS}
       WHERE m.id_m IN (SELECT s.modulos_id_m FROM submodulos s WHERE s.id_sm = ANY($1::int[]))
       ORDER BY m.id_m`,
      [idsSubmodulos]
    );
    return rows.map(row => new Modulo(row));
  },

  async insertar({ nombre_m, descripcion_m, id_area }, ejecutor = db) {
    const { rows } = await ejecutor.query(
      'INSERT INTO modulos (nombre_m, descripcion_m, id_area) VALUES ($1, $2, $3) RETURNING *',
      [nombre_m, descripcion_m, id_area]
    );
    return new Modulo(rows[0]);
  },

  async actualizar(id, { nombre_m, descripcion_m, id_area }, ejecutor = db) {
    const { rows } = await ejecutor.query(
      'UPDATE modulos SET nombre_m=$1, descripcion_m=$2, id_area=$3 WHERE id_m=$4 RETURNING *',
      [nombre_m, descripcion_m, id_area, id]
    );
    return rows.length ? new Modulo(rows[0]) : null;
  }

};

module.exports = moduloRepository;
