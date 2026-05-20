const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, m.nombre_m
      FROM submodulos s
      LEFT JOIN modulos m ON s.modulos_id_m = m.id_m
      ORDER BY s.id_sm
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener submódulos' });
  }
});

router.post('/', async (req, res) => {
  const { nombre_sm, descripcion_sm, modulos_id_m } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO submodulos (nombre_sm, descripcion_sm, modulos_id_m) VALUES ($1, $2, $3) RETURNING *',
      [nombre_sm, descripcion_sm, modulos_id_m]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear submódulo' });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre_sm, descripcion_sm, modulos_id_m } = req.body;
  try {
    const result = await db.query(
      'UPDATE submodulos SET nombre_sm=$1, descripcion_sm=$2, modulos_id_m=$3 WHERE id_sm=$4 RETURNING *',
      [nombre_sm, descripcion_sm, modulos_id_m, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar submódulo' });
  }
});

module.exports = router;