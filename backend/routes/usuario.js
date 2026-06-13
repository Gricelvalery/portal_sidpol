const express = require('express');
const router = express.Router();
const db = require('../db');

function generarUsername(nombre, apellido) {
  return `${nombre}.${apellido}`.toLowerCase().replace(/\s+/g, '');
}

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id_u, u.nombre_u, u.apellido_u, u.correo_u, 
             u.rol_u, u.username, u.id_posicion, u.autorizado,
             p.nombre_posicion, a.nombre_area
      FROM usuario u
      LEFT JOIN posicion p ON u.id_posicion = p.id_posicion
      LEFT JOIN area a ON p.id_area = a.id_area
      ORDER BY u.id_u
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre_u, apellido_u, correo_u, contrasenia_u, rol_u, id_posicion, autorizado } = req.body;
  const username = generarUsername(nombre_u, apellido_u);
  try {
    const existe = await db.query('SELECT id_u FROM usuario WHERE username = $1', [username]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: `El usuario ${username} ya existe` });
    }
    const result = await db.query(`
      INSERT INTO usuario (nombre_u, apellido_u, correo_u, contrasenia_u, rol_u, id_posicion, username, autorizado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nombre_u, apellido_u, correo_u, contrasenia_u, rol_u, id_posicion, username, autorizado || false]
    );
    res.json({ success: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre_u, apellido_u, correo_u, rol_u, id_posicion, autorizado } = req.body;
  const username = generarUsername(nombre_u, apellido_u);

  try {
    const existe = await db.query(
      'SELECT id_u FROM usuario WHERE username = $1 AND id_u <> $2',
      [username, req.params.id]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ error: `El usuario ${username} ya existe` });
    }

    const result = await db.query(`
      UPDATE usuario 
      SET nombre_u=$1, apellido_u=$2, correo_u=$3, rol_u=$4, id_posicion=$5, autorizado=$6, username=$7
      WHERE id_u=$8 RETURNING *`,
      [nombre_u, apellido_u, correo_u, rol_u, id_posicion, autorizado, username, req.params.id]
    );
    res.json({ success: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM usuario WHERE id_u = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// obtiene (get) permisos para el usuario (dashboards)
router.get('/:id/permisos', async (req, res) => {
  try {

    const result = await db.query(`
      SELECT 
        p.id_p,
        p.dashboards_id_d,
        d.nombre_d,
        s.nombre_sm,
        m.nombre_m
      FROM permisos p
      JOIN dashboards d 
        ON p.dashboards_id_d = d.id_d
      JOIN submodulos s 
        ON d.submodulos_id_sm = s.id_sm
      JOIN modulos m 
        ON s.modulos_id_m = m.id_m
      WHERE p.usuario_id_u = $1
    `, [req.params.id]);

    res.json(result.rows);

  } catch (err) {

    console.error('Error permisos:', err.message);

    res.json([]);

  }
});

// guarda los permisos (dashboards)
router.post('/:id/permisos', async (req, res) => {
  const { dashboards_ids } = req.body;
  const id_u = req.params.id;

  try {

    // quita permisos anteriores
    await db.query(
      'DELETE FROM permisos WHERE usuario_id_u = $1',
      [id_u]
    );

    // guarda los dashboards
    for (const id_d of (dashboards_ids || [])) {

      await db.query(
        `INSERT INTO permisos (
          usuario_id_u,
          dashboards_id_d
        )
        VALUES ($1, $2)`,
        [id_u, id_d]
      );

    }

    res.json({
      success: true,
      message: 'Permisos guardados'
    });

  } catch (err) {

    console.error('ERROR GUARDAR PERMISOS:', err);

    res.status(500).json({
      error: err.message
    });

  }
});

module.exports = router;
