class Modulo {
  constructor(row) {
    this.id = row.id_m;
    this.nombre = row.nombre_m;
    this.descripcion = row.descripcion_m;
    this.idArea = row.id_area;
    this.nombreArea = row.nombre_area;
  }

  toJSON() {
    return {
      id_m: this.id,
      nombre_m: this.nombre,
      descripcion_m: this.descripcion,
      id_area: this.idArea,
      nombre_area: this.nombreArea
    };
  }
}

module.exports = Modulo;