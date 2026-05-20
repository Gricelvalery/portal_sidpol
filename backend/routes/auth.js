const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { username, contrasenia } = req.body;

  try {
    const result = await db.query(
      'SELECT * FROM usuario WHERE username = $1 AND contrasenia_u = $2',
      [username, contrasenia]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = result.rows[0];

    if (!user.autorizado) {
      return res.status(403).json({ error: 'Usuario no autorizado. Contacte al administrador.' });
    }

    const token = jwt.sign(
      { id: user.id_u, rol: user.rol_u },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Traer permisos del usuario
    const permisos = await db.query(`
      SELECT 
        p.dashboards_id_d,
        d.nombre_d,
        s.id_sm,
        s.nombre_sm,
        s.ruta,
        m.nombre_m
      FROM permisos p
      LEFT JOIN dashboards d 
        ON p.dashboards_id_d = d.id_d
      LEFT JOIN submodulos s 
        ON d.submodulos_id_sm = s.id_sm
      LEFT JOIN modulos m 
        ON s.modulos_id_m = m.id_m
      WHERE p.usuario_id_u = $1
    `, [user.id_u]);

    res.json({
      success: true,
      token,
      usuario: {
        id:        user.id_u,
        nombre:    user.nombre_u,
        apellido:  user.apellido_u,
        username:  user.username,
        rol:       user.rol_u,
        correo:    user.correo_u,
        autorizado: user.autorizado
      },
      permisos: permisos.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error servidor' });
  }
});

module.exports = router;