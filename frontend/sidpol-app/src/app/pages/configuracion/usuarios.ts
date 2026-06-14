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
  cargando = true;
  busqueda = '';
  notificacion = '';
  notificacionVisible = false;
  notificacionTipo = 'exito';

  modalAbierto = false;
  modoEditar = false;
  modalEliminarAbierto = false;
  modalPermisosAbierto = false;
  usuarioSeleccionado: any = null;
  permisosSeleccionados: Set<number> = new Set();

  form = {
    nombre_u: '',
    apellido_u: '',
    correo_u: '',
    contrasenia_u: '',
    rol_u: 'User',
    id_posicion: null as any,
    autorizado: false
  };

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
  }

  buscar() {
    const q = this.busqueda.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u =>
      u.nombre_u.toLowerCase().includes(q) ||
      u.apellido_u.toLowerCase().includes(q) ||
      u.correo_u.toLowerCase().includes(q) ||
      (u.nombre_area || '').toLowerCase().includes(q)
    );
  }

  abrirAgregar() {
    this.modoEditar = false;
    this.form = { nombre_u: '', apellido_u: '', correo_u: '', contrasenia_u: '', rol_u: 'User', id_posicion: null, autorizado: false };
    this.modalAbierto = true;
  }

  abrirEditar(u: any) {
    this.modoEditar = true;
    this.usuarioSeleccionado = u;
    this.form = {
      nombre_u: u.nombre_u,
      apellido_u: u.apellido_u,
      correo_u: u.correo_u,
      contrasenia_u: '',
      rol_u: u.rol_u,
      id_posicion: u.id_posicion,
      autorizado: u.autorizado || false
    };
    this.modalAbierto = true;
  }

  cerrarModal() { this.modalAbierto = false; }

  guardar() {
    if (!this.form.nombre_u || !this.form.apellido_u || !this.form.correo_u) return;

    if (this.modoEditar) {
      this.svc.editarUsuario(this.usuarioSeleccionado.id_u, this.form).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
          this.mostrarNotificacion('Usuario actualizado correctamente');
        },
        error: (err) => { alert(err.error?.error || 'Error al editar usuario'); }
      });
    } else {
      if (!this.form.contrasenia_u) return;
      this.svc.crearUsuario(this.form).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
          this.mostrarNotificacion('Usuario creado correctamente');
        },
        error: (err) => { alert(JSON.stringify(err.error)); }
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
      }
    });
  }

  abrirPermisos(u: any) {
    this.usuarioSeleccionado = u;
    this.permisosSeleccionados = new Set();
    this.svc.getPermisos(u.id_u).subscribe({
      next: (data) => {
        data.forEach((p: any) => {
          if (p.dashboards_id_d) this.permisosSeleccionados.add(p.dashboards_id_d);
        });
        this.modalPermisosAbierto = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.modalPermisosAbierto = true;
        this.cdr.detectChanges();
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

  guardarPermisos() {
    const ids_d = Array.from(this.permisosSeleccionados);
    this.svc.guardarPermisos(this.usuarioSeleccionado.id_u, ids_d, []).subscribe({
      next: () => {
        this.modalPermisosAbierto = false;
        this.mostrarNotificacion('Permisos actualizados correctamente', 'exito');
      },
      error: () => {
        this.mostrarNotificacion('Error al guardar permisos', 'error');
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