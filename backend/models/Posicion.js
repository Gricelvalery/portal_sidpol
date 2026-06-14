class Posicion {
  constructor(row) {
    this.id = row.id_posicion;
    this.nombre = row.nombre_posicion;
    this.descripcion = row.descripcion_p;
    this.idArea = row.id_area;
    this.nombreArea = row.nombre_area;
  }

  toJSON() {
    return {
      id_posicion: this.id,
      nombre_posicion: this.nombre,
      descripcion_p: this.descripcion,
      id_area: this.idArea,
      nombre_area: this.nombreArea
    };
  }
}

module.exports = Posicion;