const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, s.nombre_sm, m.nombre_m
      FROM dashboards d
      LEFT JOIN submodulos s ON d.submodulos_id_sm = s.id_sm
      LEFT JOIN modulos m ON s.modulos_id_m = m.id_m
      ORDER BY d.id_d
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener dashboards' });
  }
});

router.post('/', async (req, res) => {
  const { nombre_d, link_d, submodulos_id_sm, paginas } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO dashboards (nombre_d, link_d, submodulos_id_sm, paginas) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre_d, link_d, submodulos_id_sm, JSON.stringify(paginas || [])]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear dashboard' });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre_d, link_d, submodulos_id_sm, paginas } = req.body;
  try {
    const result = await db.query(
      'UPDATE dashboards SET nombre_d=$1, link_d=$2, submodulos_id_sm=$3, paginas=$4 WHERE id_d=$5 RETURNING *',
      [nombre_d, link_d, submodulos_id_sm, JSON.stringify(paginas || []), req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar dashboard' });
  }
});

module.exports = router;