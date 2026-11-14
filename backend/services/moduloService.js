const AppError = require('../utils/AppError');
const moduloRepository = require('../repositories/moduloRepository');
const permisoService = require('./permisoService');

const moduloService = {

  // Admin ve todo; user solo los módulos que contienen algún submódulo accesible.
  async listar(usuario) {
    const accesos = await permisoService.accesosDe(usuario);
    if (!accesos) return moduloRepository.listar();
    return moduloRepository.listar({ idsSubmodulos: accesos.submodulos });
  },

  crear(datos) {
    return moduloRepository.insertar(datos);
  },

  async actualizar(id, datos) {
    const modulo = await moduloRepository.actualizar(id, datos);
    if (!modulo) throw AppError.notFound('Módulo no encontrado');
    return modulo;
  }

};

module.exports = moduloService;
