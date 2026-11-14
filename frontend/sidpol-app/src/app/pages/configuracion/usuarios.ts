import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModulosService } from '../../services/modulos';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  posiciones: any[] = [];
  dashboards: any[] = [];
  submodulosAsignables: any[] = [];
  cargando = true;
  busqueda = '';
  notificacion = '';
  notificacionVisible = false;
  notificacionTipo = 'exito';
  erroresFormulario: Record<string, string> = {};
  errorFormularioGeneral = '';

  modalAbierto = false;
  modoEditar = false;
  modalEliminarAbierto = false;
  modalPermisosAbierto = false;
  usuarioSeleccionado: any = null;
  permisosSeleccionados: Set<number> = new Set();
  submodulosSeleccionados: Set<number> = new Set();

  // username y correo los genera el backend; no se piden en el formulario
  form = this.formVacio();

  private formVacio() {
    return {
      nombres_u: '',
      apellido_paterno_u: '',
      apellido_materno_u: '',
      contrasenia_u: '',
      rol_u: 'user',
      id_posicion: null as any,
      autorizado: false
    };
  }

  constructor(private svc: ModulosService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.cargarDatos(); }

  mostrarNotificacion(msg: string, tipo: string = 'exito') {
    this.notificacion = msg;
    this.notificacionTipo = tipo;
    this.notificacionVisible = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.notificacionVisible = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  cargarDatos() {
    this.svc.getUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.usuariosFiltrados = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; }
    });
    this.svc.getPosiciones().subscribe({ next: (data) => { this.posiciones = data; } });
    this.svc.getDashboards().subscribe({ next: (data) => { this.dashboards = data; } });
    // Los submódulos de configuración son exclusivos del admin: no se asignan
    this.svc.getSubmodulos().subscribe({
      next: (data) => {
        this.submodulosAsignables = data.filter((s: any) => !(s.ruta || '').startsWith('configuracion/'));
      }
    });
  }

  buscar() {
    const q = this.busqueda.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u =>
      [u.nombres_u, u.apellido_paterno_u, u.apellido_materno_u, u.username, u.correo_u, u.nombre_area]
        .some(campo => (campo || '').toLowerCase().includes(q))
    );
  }

  abrirAgregar() {
    this.modoEditar = false;
    this.form = this.formVacio();
    this.erroresFormulario = {};
    this.errorFormularioGeneral = '';
    this.modalAbierto = true;
  }

  abrirEditar(u: any) {
    this.modoEditar = true;
    this.usuarioSeleccionado = u;
    this.form = {
      nombres_u: u.nombres_u,
      apellido_paterno_u: u.apellido_paterno_u,
      apellido_materno_u: u.apellido_materno_u || '',
      contrasenia_u: '',
      rol_u: u.rol_u,
      id_posicion: u.id_posicion,
      autorizado: u.autorizado || false
    };
    this.erroresFormulario = {};
    this.errorFormularioGeneral = '';
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.erroresFormulario = {};
    this.errorFormularioGeneral = '';
  }

  limpiarError(campo: string) {
    if (!this.erroresFormulario[campo]) return;
    const { [campo]: _omitido, ...errores } = this.erroresFormulario;
    this.erroresFormulario = errores;
    this.errorFormularioGeneral = '';
  }

  private aplicarErroresFormulario(err: any, mensajeFallback: string) {
    const errores = err.error?.errors;

    if (Array.isArray(errores)) {
      this.erroresFormulario = errores.reduce((acc: Record<string, string>, error: any) => {
        if (error.path && !acc[error.path]) acc[error.path] = error.msg;
        return acc;
      }, {});
      this.errorFormularioGeneral = '';
      this.cdr.detectChanges();
      return;
    }

    this.errorFormularioGeneral = err.error?.error || mensajeFallback;
    this.cdr.detectChanges();
  }

  guardar() {
    this.erroresFormulario = {};
    this.errorFormularioGeneral = '';
    const errores: Record<string, string> = {};
    // Misma regla que el backend: letras y espacios simples ("Juan Carlos", "De la Cruz")
    const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+( [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;
    const limpio = (v: string) => (v || '').replace(/\s+/g, ' ').trim();
    this.form.nombres_u = limpio(this.form.nombres_u);
    this.form.apellido_paterno_u = limpio(this.form.apellido_paterno_u);
    this.form.apellido_materno_u = limpio(this.form.apellido_materno_u);

    if (!this.form.nombres_u) {
      errores['nombres_u'] = 'Los nombres son requeridos';
    } else if (!soloLetras.test(this.form.nombres_u)) {
      errores['nombres_u'] = 'Los nombres solo deben contener letras';
    }

    if (!this.form.apellido_paterno_u) {
      errores['apellido_paterno_u'] = 'El apellido paterno es requerido';
    } else if (!soloLetras.test(this.form.apellido_paterno_u)) {
      errores['apellido_paterno_u'] = 'El apellido paterno solo debe contener letras';
    }

    if (this.form.apellido_materno_u && !soloLetras.test(this.form.apellido_materno_u)) {
      errores['apellido_materno_u'] = 'El apellido materno solo debe contener letras';
    }
    if (!this.form.id_posicion) errores['id_posicion'] = 'Selecciona una posición';

    if (!this.modoEditar) {
      if (!this.form.contrasenia_u) {
        errores['contrasenia_u'] = 'La contraseña es requerida';
      } else if (this.form.contrasenia_u.length < 6 || this.form.contrasenia_u.length > 72) {
        errores['contrasenia_u'] = 'La contraseña debe tener entre 6 y 72 caracteres';
      }
    }

    if (Object.keys(errores).length > 0) {
      this.erroresFormulario = errores;
      return;
    }

    if (this.modoEditar) {
      const { contrasenia_u, ...datos } = this.form;
      this.svc.editarUsuario(this.usuarioSeleccionado.id_u, datos).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
          this.mostrarNotificacion('Usuario actualizado correctamente');
        },
        error: (err) => { this.aplicarErroresFormulario(err, 'Error al editar usuario'); }
      });
    } else {
      // Todo usuario nuevo se crea con rol 'user' y sin permisos (lo fuerza el backend)
      const { rol_u, ...datos } = this.form;
      this.svc.crearUsuario(datos).subscribe({
        next: (resp: any) => {
          this.cerrarModal();
          this.cargarDatos();
          this.mostrarNotificacion('Usuario creado: ' + resp.usuario?.username + ' (' + resp.usuario?.correo_u + ')');
        },
        error: (err) => { this.aplicarErroresFormulario(err, 'Error al crear usuario'); }
      });
    }
  }

  confirmarEliminar(u: any) {
    this.usuarioSeleccionado = u;
    this.modalEliminarAbierto = true;
  }

  eliminar() {
    this.svc.eliminarUsuario(this.usuarioSeleccionado.id_u).subscribe({
      next: () => {
        this.modalEliminarAbierto = false;
        this.cargarDatos();
        this.mostrarNotificacion('Usuario eliminado correctamente');
      },
      error: (err) => {
        this.modalEliminarAbierto = false;
        this.mostrarNotificacion(err.error?.error || 'Error al eliminar usuario', 'error');
      }
    });
  }

  abrirPermisos(u: any) {
    this.usuarioSeleccionado = u;
    this.permisosSeleccionados = new Set();
    this.submodulosSeleccionados = new Set();
    this.svc.getPermisos(u.id_u).subscribe({
      next: (data) => {
        this.permisosSeleccionados = new Set(data.dashboards_ids);
        this.submodulosSeleccionados = new Set(data.submodulos_ids);
        this.modalPermisosAbierto = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.mostrarNotificacion('Error al cargar permisos', 'error');
      }
    });
  }

  togglePermiso(id_d: number) {
    if (this.permisosSeleccionados.has(id_d)) {
      this.permisosSeleccionados.delete(id_d);
    } else {
      this.permisosSeleccionados.add(id_d);
    }
  }

  tienePermiso(id_d: number): boolean {
    return this.permisosSeleccionados.has(id_d);
  }

  toggleSubmodulo(id_sm: number) {
    if (this.submodulosSeleccionados.has(id_sm)) {
      this.submodulosSeleccionados.delete(id_sm);
    } else {
      this.submodulosSeleccionados.add(id_sm);
    }
  }

  tieneSubmodulo(id_sm: number): boolean {
    return this.submodulosSeleccionados.has(id_sm);
  }

  esAdminUsuario(u: any): boolean {
    return u?.rol_u === 'admin';
  }

  nombreCompleto(u: any): string {
    return [u?.nombres_u, u?.apellido_paterno_u, u?.apellido_materno_u].filter(Boolean).join(' ');
  }

  guardarPermisos() {
    const ids_d = Array.from(this.permisosSeleccionados);
    const ids_sm = Array.from(this.submodulosSeleccionados);
    this.svc.guardarPermisos(this.usuarioSeleccionado.id_u, ids_d, ids_sm).subscribe({
      next: () => {
        this.modalPermisosAbierto = false;
        this.mostrarNotificacion('Permisos actualizados correctamente', 'exito');
      },
      error: (err) => {
        this.mostrarNotificacion(err.error?.error || 'Error al guardar permisos', 'error');
      }
    });
  }

  get dashboardsAgrupados(): any[] {
    const grupos: any[] = [];
    this.dashboards.forEach(d => {
      const key = `${d.nombre_m} — ${d.nombre_sm}`;
      let grupo = grupos.find(g => g.key === key);
      if (!grupo) { grupo = { key, dashboards: [] }; grupos.push(grupo); }
      grupo.dashboards.push(d);
    });
    return grupos;
  }
}
