const AppError = require('../utils/AppError');
const dashboardRepository = require('../repositories/dashboardRepository');
const permisoService = require('./permisoService');

const dashboardService = {
  // Admin ve todo; user solo los dashboards permitidos.
  async listar(usuario) {
    const accesos = await permisoService.accesosDe(usuario);
    if (!accesos) return dashboardRepository.listar();
    return dashboardRepository.listar({ ids: accesos.dashboards });
  },

  // El acceso ya fue validado por checkPermission('dashboard').
  async obtener(id) {
    const dashboard = await dashboardRepository.obtener(id);
    if (!dashboard) throw AppError.notFound('Dashboard no encontrado');
    return dashboard;
  },

  // Dashboards de un submódulo que el usuario puede ver.
  // El acceso al submódulo ya fue validado por checkPermission('submodulo').
  async listarPorSubmodulo(idSubmodulo, usuario) {
    const accesos = await permisoService.accesosDe(usuario);
    if (!accesos) return dashboardRepository.listar({ idSubmodulo });
    return dashboardRepository.listar({ idSubmodulo, ids: accesos.dashboards });
  },

  crear(datos) {
    return dashboardRepository.insertar(datos);
  },

  async actualizar(id, datos) {
    const dashboard = await dashboardRepository.actualizar(id, datos);
    if (!dashboard) throw AppError.notFound('Dashboard no encontrado');
    return dashboard;
  },
};

module.exports = dashboardService;
