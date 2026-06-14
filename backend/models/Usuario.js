class Usuario {
  constructor(row) {
    this.id = row.id_u;
    this.nombre = row.nombre_u;
    this.apellido = row.apellido_u;
    this.username = row.username;
    this.correo = row.correo_u;
    this.rol = row.rol_u;
    this.autorizado = row.autorizado;
    this.idPosicion = row.id_posicion;
    this.nombrePosicion = row.nombre_posicion;
    this.nombreArea = row.nombre_area;
  }

  toJSON() {
    return {
      id_u: this.id,
      nombre_u: this.nombre,
      apellido_u: this.apellido,
      username: this.username,
      correo_u: this.correo,
      rol_u: this.rol,
      autorizado: this.autorizado,
      id_posicion: this.idPosicion,
      nombre_posicion: this.nombrePosicion,
      nombre_area: this.nombreArea
    };
  }
}

module.exports = Usuario;