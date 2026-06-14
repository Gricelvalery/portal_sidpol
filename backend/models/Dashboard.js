class Dashboard {
  constructor(row) {
    this.id = row.id_d;
    this.nombre = row.nombre_d;
    this.link = row.link_d;
    this.idSubmodulo = row.submodulos_id_sm;
    this.paginas = row.paginas;
    this.nombreSubmodulo = row.nombre_sm;
    this.nombreModulo = row.nombre_m;
  }

  toJSON() {
    return {
      id_d: this.id,
      nombre_d: this.nombre,
      link_d: this.link,
      submodulos_id_sm: this.idSubmodulo,
      paginas: this.paginas,
      nombre_sm: this.nombreSubmodulo,
      nombre_m: this.nombreModulo
    };
  }
}

module.exports = Dashboard;