const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT m.*, a.nombre_area 
      FROM modulos m
      LEFT JOIN area a ON m.id_area = a.id_area
      ORDER BY m.id_m
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener módulos' });
  }
});

router.post('/', async (req, res) => {
  const { nombre_m, descripcion_m, id_area } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO modulos (nombre_m, descripcion_m, id_area) VALUES ($1, $2, $3) RETURNING *',
      [nombre_m, descripcion_m, id_area]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear módulo' });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre_m, descripcion_m, id_area } = req.body;
  try {
    const result = await db.query(
      'UPDATE modulos SET nombre_m=$1, descripcion_m=$2, id_area=$3 WHERE id_m=$4 RETURNING *',
      [nombre_m, descripcion_m, id_area, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar módulo' });
  }
});

module.exports = router;