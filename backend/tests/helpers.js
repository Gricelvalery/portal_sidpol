const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Usuario = require('../models/Usuario');

/** Header Authorization con un JWT válido (o con las opciones que se pasen). */
function tokenDe(id, rol = 'user', opciones = {}) {
  const { secreto = env.JWT_SECRET, ...firma } = opciones;
  return (
    'Bearer ' + jwt.sign({ id, rol }, secreto, { algorithm: 'HS256', expiresIn: '5m', ...firma })
  );
}

/**
 * Simula usuarioRepository.obtenerEstado (lo usan el middleware de auth y el
 * servicio de usuarios). sesiones = { 1: { rol: 'admin' }, 2: { rol: 'user' } }
 */
function configurarSesiones(usuarioRepository, sesiones) {
  usuarioRepository.obtenerEstado.mockImplementation(async (id) => {
    const s = sesiones[id];
    return s ? { id: Number(id), autorizado: true, ...s } : null;
  });
}

/** Fila de BD → modelo Usuario, con valores por defecto. */
function usuarioDe(campos = {}) {
  return new Usuario({
    id_u: 10,
    nombres_u: 'Juan',
    apellido_paterno_u: 'Perez',
    apellido_materno_u: null,
    username: 'juan.perez',
    correo_u: 'juan.perez@sidpol.pe',
    rol_u: 'user',
    autorizado: true,
    id_posicion: 1,
    contrasenia_u: 'NO-DEBE-SALIR',
    ...campos,
  });
}

/** Silencia console.error/warn en pruebas que provocan errores a propósito. */
function silenciarConsola() {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  return () => {
    error.mockRestore();
    warn.mockRestore();
  };
}

module.exports = { tokenDe, configurarSesiones, usuarioDe, silenciarConsola };
