class Usuario {
  constructor(row) {
    this.id = row.id_u;
    this.nombres = row.nombres_u;
    this.apellidoPaterno = row.apellido_paterno_u;
    this.apellidoMaterno = row.apellido_materno_u;
    this.username = row.username;
    this.correo = row.correo_u;
    this.rol = row.rol_u;
    this.autorizado = row.autorizado;
    this.idPosicion = row.id_posicion;
    this.nombrePosicion = row.nombre_posicion;
    this.nombreArea = row.nombre_area;
  }
//envia al frontend sin contraseña
  toJSON() {
    return {
      id_u: this.id,
      nombres_u: this.nombres,
      apellido_paterno_u: this.apellidoPaterno,
      apellido_materno_u: this.apellidoMaterno,
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
