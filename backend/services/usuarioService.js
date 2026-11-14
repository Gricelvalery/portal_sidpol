const bcrypt = require('bcrypt');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const usuarioRepository = require('../repositories/usuarioRepository');
const permisoRepository = require('../repositories/permisoRepository');
const { withTransaction } = require('../repositories/transaccion');
const { candidatosUsername, correoDe } = require('../utils/username');

const MAX_CANDIDATOS = 10000;
const REINTENTOS_INSERT = 3;

/** Primer username libre: juan.perez → juan.perezc → juan.perezc2 ... (una sola consulta a la BD). */
async function elegirUsername(nombres, apellidoPaterno, apellidoMaterno) {
  const candidatos = candidatosUsername(nombres, apellidoPaterno, apellidoMaterno);
  const base = candidatos.next().value;
  const ocupados = await usuarioRepository.usernamesConPrefijo(base);
  if (!ocupados.has(base)) return base;
  for (let i = 0; i < MAX_CANDIDATOS; i++) {
    const candidato = candidatos.next().value;
    if (!ocupados.has(candidato)) return candidato;
  }
  throw AppError.conflict('No se pudo generar un nombre de usuario disponible');
}

/**
 * Dentro de una transacción: bloquea a los admins autorizados (FOR UPDATE, en orden)
 * y luego al usuario objetivo. Así dos cambios simultáneos no pueden dejar 0 admins.
 */
async function bloquearObjetivo(client, id) {
  const admins = await usuarioRepository.bloquearAdminsAutorizados(client);
  const objetivo = await usuarioRepository.obtenerEstado(id, client, { bloquear: true });
  if (!objetivo) throw AppError.notFound('Usuario no encontrado');
  return { objetivo, otrosAdmins: admins.filter(a => a !== objetivo.id).length };
}

async function exigirUsuario(id) {
  const estado = await usuarioRepository.obtenerEstado(id);
  if (!estado) throw AppError.notFound('Usuario no encontrado');
  return estado;
}

const usuarioService = {

  listar() {
    return usuarioRepository.listar();
  },

  // Todo usuario nuevo nace con rol 'user' y sin permisos.
  async crear(datos) {
    const { nombres_u, apellido_paterno_u, apellido_materno_u, contrasenia_u, id_posicion, autorizado } = datos;
    const hash = await bcrypt.hash(contrasenia_u, env.BCRYPT_COST);

    // Si otro admin crea el mismo username en paralelo, el UNIQUE lo rechaza (23505) y se reintenta.
    for (let intento = 0; intento < REINTENTOS_INSERT; intento++) {
      const username = await elegirUsername(nombres_u, apellido_paterno_u, apellido_materno_u);
      try {
        return await usuarioRepository.insertar({
          nombres_u,
          apellido_paterno_u,
          apellido_materno_u: apellido_materno_u || null,
          correo_u: correoDe(username),
          contrasenia_u: hash,
          rol_u: 'user',
          id_posicion,
          username,
          autorizado: autorizado === true
        });
      } catch (err) {
        if (err.code !== '23505') throw err;
      }
    }
    throw AppError.conflict('No se pudo generar un nombre de usuario disponible');
  },

  // El username y el correo NO cambian al editar el nombre.
  async actualizar(id, datos, actor) {
    const { nombres_u, apellido_paterno_u, apellido_materno_u, rol_u, id_posicion, autorizado } = datos;

    return withTransaction(async (client) => {
      const { objetivo, otrosAdmins } = await bloquearObjetivo(client, id);

      const pierdeAdmin = objetivo.rol === 'admin' && (rol_u !== 'admin' || autorizado === false);
      if (pierdeAdmin) {
        if (objetivo.id === actor.id) {
          throw AppError.badRequest('No puedes quitarte el rol de administrador ni desautorizarte');
        }
        if (otrosAdmins === 0) {
          throw AppError.badRequest('Debe existir al menos un administrador autorizado');
        }
      }

      return usuarioRepository.actualizar(id, {
        nombres_u, apellido_paterno_u, apellido_materno_u: apellido_materno_u || null,
        rol_u, id_posicion, autorizado
      }, client);
    });
  },

  async eliminar(id, actor) {
    await withTransaction(async (client) => {
      const { objetivo, otrosAdmins } = await bloquearObjetivo(client, id);
      if (objetivo.id === actor.id) {
        throw AppError.badRequest('No puedes eliminar tu propio usuario');
      }
      if (objetivo.rol === 'admin' && otrosAdmins === 0) {
        throw AppError.badRequest('Debe existir al menos un administrador autorizado');
      }
      await permisoRepository.eliminarDeUsuario(id, client);
      await usuarioRepository.eliminar(id, client);
    });
    return true;
  },

  async obtenerPermisos(id) {
    await exigirUsuario(id);
    return permisoRepository.asignados(id);
  },

  async guardarPermisos(id, { submodulos_ids = [], dashboards_ids = [] }) {
    const subs = [...new Set(submodulos_ids)];
    const dashs = [...new Set(dashboards_ids)];

    await exigirUsuario(id);
    if ((await permisoRepository.submodulosDeConfiguracion(subs)).length > 0) {
      throw AppError.badRequest('Los submódulos de configuración son exclusivos del administrador');
    }

    // Borrar + insertar: todo o nada
    await withTransaction((client) => permisoRepository.reemplazar(id, subs, dashs, client));
    return true;
  }

};

module.exports = usuarioService;
