const AppError = require('../utils/AppError');
const submoduloRepository = require('../repositories/submoduloRepository');
const permisoService = require('./permisoService');

const submoduloService = {
  // Admin ve todo; user solo los submódulos a los que tiene acceso.
  async listar(usuario) {
    const accesos = await permisoService.accesosDe(usuario);
    if (!accesos) return submoduloRepository.listar();
    return submoduloRepository.listar({ ids: accesos.submodulos });
  },

  crear(datos) {
    return submoduloRepository.insertar(datos);
  },

  async actualizar(id, datos) {
    const submodulo = await submoduloRepository.actualizar(id, datos);
    if (!submodulo) throw AppError.notFound('Submódulo no encontrado');
    return submodulo;
  },
};

module.exports = submoduloService;
