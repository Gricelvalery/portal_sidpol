class Area {
  constructor(row) {
    this.id = row.id_area;
    this.nombre = row.nombre_area;
    this.descripcion = row.descripcion_area;
  }

  toJSON() {
    return {
      id_area: this.id,
      nombre_area: this.nombre,
      descripcion_area: this.descripcion
    };
  }
}

module.exports = Area;