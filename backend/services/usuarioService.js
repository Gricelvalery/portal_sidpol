const db = require('../config/db');
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const permisoService = require('./permisoService');
const { candidatosUsername, correoDe } = require('../utils/username');

const BCRYPT_COST = 12;
const MAX_INTENTOS_USERNAME = 1000;

async function enTransaccion(fn) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function generarUsernameDisponible(nombres, apellidoPaterno, apellidoMaterno) {
  const candidatos = candidatosUsername(nombres, apellidoPaterno, apellidoMaterno);
  for (let i = 0; i < MAX_INTENTOS_USERNAME; i++) {
    const username = candidatos.next().value;
    const existe = await db.query(
      'SELECT 1 FROM usuario WHERE username = $1 OR correo_u = $2',
      [username, correoDe(username)]
    );
    if (existe.rows.length === 0) return username;
  }
  throw { status: 409, message: 'No se pudo generar un nombre de usuario disponible' };
}

async function contarOtrosAdmins(id) {
  const r = await db.query(
    `SELECT count(*)::int AS n FROM usuario WHERE rol_u = 'admin' AND autorizado AND id_u <> $1`,
    [id]
  );
  return r.rows[0].n;
}

async function obtenerFila(id) {
  const r = await db.query('SELECT id_u, rol_u, autorizado FROM usuario WHERE id_u = $1', [id]);
  if (r.rows.length === 0) throw { status: 404, message: 'Usuario no encontrado' };
  return r.rows[0];
}

const usuarioService = {

  async listar() {
    const result = await db.query(`
      SELECT u.id_u, u.nombres_u, u.apellido_paterno_u, u.apellido_materno_u, u.correo_u,
             u.rol_u, u.username, u.id_posicion, u.autorizado,
             p.nombre_posicion, a.nombre_area
        FROM usuario u
        LEFT JOIN posicion p ON u.id_posicion = p.id_posicion
        LEFT JOIN area a ON p.id_area = a.id_area
       ORDER BY u.id_u
    `);
    return result.rows.map(row => new Usuario(row).toJSON());
  },

  // Todo usuario nuevo nace con rol 'user' y sin permisos.
  async crear(datos) {
    const { nombres_u, apellido_paterno_u, apellido_materno_u, contrasenia_u, id_posicion, autorizado } = datos;
    const hash = await bcrypt.hash(contrasenia_u, BCRYPT_COST);

    // Reintenta si otro admin creó el mismo username en paralelo (violación UNIQUE)
    for (let intento = 0; intento < 3; intento++) {
      const username = await generarUsernameDisponible(nombres_u, apellido_paterno_u, apellido_materno_u);
      try {
        const result = await db.query(`
          INSERT INTO usuario (nombres_u, apellido_paterno_u, apellido_materno_u, correo_u,
                               contrasenia_u, rol_u, id_posicion, username, autorizado)
          VALUES ($1, $2, $3, $4, $5, 'user', $6, $7, $8) RETURNING *`,
          [nombres_u, apellido_paterno_u, apellido_materno_u || null, correoDe(username),
           hash, id_posicion, username, autorizado === true]
        );
        return new Usuario(result.rows[0]).toJSON();
      } catch (err) {
        if (err.code !== '23505') throw err;
      }
    }
    throw { status: 409, message: 'No se pudo generar un nombre de usuario disponible' };
  },

  // El username y el correo NO cambian al editar el nombre.
  async actualizar(id, datos, actor) {
    const { nombres_u, apellido_paterno_u, apellido_materno_u, rol_u, id_posicion, autorizado } = datos;
    const actual = await obtenerFila(id);

    const pierdeAdmin = actual.rol_u === 'admin' && (rol_u !== 'admin' || autorizado === false);
    if (pierdeAdmin) {
      if (actual.id_u === actor.id) {
        throw { status: 400, message: 'No puedes quitarte el rol de administrador ni desautorizarte' };
      }
      if (await contarOtrosAdmins(id) === 0) {
        throw { status: 400, message: 'Debe existir al menos un administrador autorizado' };
      }
    }

    const result = await db.query(`
      UPDATE usuario
         SET nombres_u = $1, apellido_paterno_u = $2, apellido_materno_u = $3,
             rol_u = $4, id_posicion = $5, autorizado = $6
       WHERE id_u = $7 RETURNING *`,
      [nombres_u, apellido_paterno_u, apellido_materno_u || null, rol_u, id_posicion, autorizado, id]
    );
    return new Usuario(result.rows[0]).toJSON();
  },

  async eliminar(id, actor) {
    const actual = await obtenerFila(id);
    if (actual.id_u === actor.id) {
      throw { status: 400, message: 'No puedes eliminar tu propio usuario' };
    }
    if (actual.rol_u === 'admin' && await contarOtrosAdmins(id) === 0) {
      throw { status: 400, message: 'Debe existir al menos un administrador autorizado' };
    }

    await enTransaccion(async (client) => {
      await client.query('DELETE FROM permisos WHERE usuario_id_u = $1', [id]);
      await client.query('DELETE FROM permisos_submodulo WHERE usuario_id_u = $1', [id]);
      await client.query('DELETE FROM usuario WHERE id_u = $1', [id]);
    });
    return true;
  },

  async obtenerPermisos(id) {
    await obtenerFila(id);
    const [subs, dashs] = await Promise.all([
      db.query('SELECT submodulos_id_sm FROM permisos_submodulo WHERE usuario_id_u = $1', [id]),
      db.query('SELECT dashboards_id_d FROM permisos WHERE usuario_id_u = $1', [id])
    ]);
    return {
      submodulos_ids: subs.rows.map(r => r.submodulos_id_sm),
      dashboards_ids: dashs.rows.map(r => r.dashboards_id_d)
    };
  },

  async guardarPermisos(id, { submodulos_ids = [], dashboards_ids = [] }) {
    await obtenerFila(id);
    const subs = [...new Set(submodulos_ids)];
    const dashs = [...new Set(dashboards_ids)];

    if ((await permisoService.submodulosDeConfiguracion(subs)).length > 0) {
      throw { status: 400, message: 'Los submódulos de configuración son exclusivos del administrador' };
    }

    await enTransaccion(async (client) => {
      await client.query('DELETE FROM permisos_submodulo WHERE usuario_id_u = $1', [id]);
      await client.query('DELETE FROM permisos WHERE usuario_id_u = $1', [id]);
      if (subs.length) {
        await client.query(
          'INSERT INTO permisos_submodulo (usuario_id_u, submodulos_id_sm) SELECT $1, unnest($2::int[])',
          [id, subs]
        );
      }
      if (dashs.length) {
        await client.query(
          'INSERT INTO permisos (usuario_id_u, dashboards_id_d) SELECT $1, unnest($2::int[])',
          [id, dashs]
        );
      }
    });
    return true;
  }

};

module.exports = usuarioService;
