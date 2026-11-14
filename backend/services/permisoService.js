const permisoRepository = require('../repositories/permisoRepository');

const esAdmin = (usuario) => usuario?.rol === 'admin';

// Reglas de acceso. El admin tiene acceso total; el resto, lo que diga permisoRepository.
const permisoService = {

  esAdmin,

  /** Accesos efectivos del usuario, o null si es admin (= sin filtro). */
  async accesosDe(usuario) {
    if (esAdmin(usuario)) return null;
    return permisoRepository.accesos(usuario.id);
  },

  async tieneAcceso(usuario, tipo, id) {
    if (esAdmin(usuario)) return true;
    return permisoRepository.tieneAcceso(usuario.id, tipo, id);
  }

};

module.exports = permisoService;
