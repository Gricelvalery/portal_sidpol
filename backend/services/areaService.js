const AppError = require('../utils/AppError');
const areaRepository = require('../repositories/areaRepository');

const areaService = {

  listar() {
    return areaRepository.listar();
  },

  crear(datos) {
    return areaRepository.insertar(datos);
  },

  async actualizar(id, datos) {
    const area = await areaRepository.actualizar(id, datos);
    if (!area) throw AppError.notFound('Área no encontrada');
    return area;
  }

};

module.exports = areaService;
