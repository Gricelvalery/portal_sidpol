const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM area ORDER BY id_area');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener áreas' });
  }
});

router.post('/', async (req, res) => {
  const { nombre_area, descripcion_area } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO area (nombre_area, descripcion_area) VALUES ($1, $2) RETURNING *',
      [nombre_area, descripcion_area]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear área' });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre_area, descripcion_area } = req.body;
  try {
    const result = await db.query(
      'UPDATE area SET nombre_area=$1, descripcion_area=$2 WHERE id_area=$3 RETURNING *',
      [nombre_area, descripcion_area, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar área' });
  }
});

module.exports = router;