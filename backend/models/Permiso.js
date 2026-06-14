class Permiso {
  constructor(row) {
    this.id = row.id_p;
    this.dashboardId = row.dashboards_id_d;
    this.nombreDashboard = row.nombre_d;
    this.idSubmodulo = row.id_sm;
    this.nombreSubmodulo = row.nombre_sm;
    this.ruta = row.ruta;
    this.nombreModulo = row.nombre_m;
  }

  toJSON() {
    return {
      id_p: this.id,
      dashboards_id_d: this.dashboardId,
      nombre_d: this.nombreDashboard,
      id_sm: this.idSubmodulo,
      nombre_sm: this.nombreSubmodulo,
      ruta: this.ruta,
      nombre_m: this.nombreModulo
    };
  }
}

module.exports = Permiso;