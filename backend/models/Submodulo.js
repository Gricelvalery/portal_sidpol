class Submodulo {
  constructor(row) {
    this.id = row.id_sm;
    this.nombre = row.nombre_sm;
    this.descripcion = row.descripcion_sm;
    this.idModulo = row.modulos_id_m;
    this.nombreModulo = row.nombre_m;
    this.ruta = row.ruta;
  }

  toJSON() {
    return {
      id_sm: this.id,
      nombre_sm: this.nombre,
      descripcion_sm: this.descripcion,
      modulos_id_m: this.idModulo,
      nombre_m: this.nombreModulo,
      ruta: this.ruta
    };
  }
}

module.exports = Submodulo;