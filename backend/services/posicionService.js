const posicionRepository = require('../repositories/posicionRepository');

const posicionService = {

  listar() {
    return posicionRepository.listar();
  },

  crear(datos) {
    return posicionRepository.insertar(datos);
  }

};

module.exports = posicionService;
