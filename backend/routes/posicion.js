const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, a.nombre_area 
      FROM posicion p
      JOIN area a ON p.id_area = a.id_area
      ORDER BY p.id_posicion
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre_posicion, descripcion_p, id_area } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO posicion (nombre_posicion, descripcion_p, id_area) VALUES ($1, $2, $3) RETURNING *',
      [nombre_posicion, descripcion_p, id_area]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;