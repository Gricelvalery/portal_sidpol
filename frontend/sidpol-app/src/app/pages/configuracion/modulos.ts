import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModulosService } from '../../services/modulos';

@Component({
  selector: 'app-modulos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modulos.html',
  styleUrl: './modulos.css'
})
export class Modulos implements OnInit {
  modulos: any[] = [];
  modulosFiltrados: any[] = [];
  areas: any[] = [];
  cargando = true;
  busqueda = '';
  notificacion = '';
  notificacionVisible = false;
  notificacionTipo = 'exito';

  modalAbierto = false;
  modoEditar = false;
  moduloSeleccionado: any = null;
  erroresFormulario: Record<string, string> = {};
  errorFormularioGeneral = '';
  form = { nombre_m: '', descripcion_m: '', id_area: null as any };

  constructor(private svc: ModulosService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarDatos();
  }

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
    this.svc.getModulos().subscribe({
      next: (data) => {
        this.modulos = data;
        this.modulosFiltrados = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
    this.svc.getAreas().subscribe({
      next: (data) => {
        this.areas = data;
        this.cdr.detectChanges();
      }
    });
  }

  buscar() {
    const q = this.busqueda.toLowerCase();
    this.modulosFiltrados = this.modulos.filter(m =>
      m.nombre_m.toLowerCase().includes(q) ||
      (m.descripcion_m || '').toLowerCase().includes(q)
    );
  }

  abrirAgregar() {
    this.modoEditar = false;
    this.form = { nombre_m: '', descripcion_m: '', id_area: null };
    this.erroresFormulario = {};
    this.errorFormularioGeneral = '';
    this.modalAbierto = true;
  }

  abrirEditar(m: any) {
    this.modoEditar = true;
    this.moduloSeleccionado = m;
    this.form = { nombre_m: m.nombre_m, descripcion_m: m.descripcion_m, id_area: m.id_area };
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

    if (!this.form.nombre_m.trim()) errores['nombre_m'] = 'El nombre es requerido';
    if (!this.form.descripcion_m.trim()) errores['descripcion_m'] = 'La descripción es requerida';
    if (!this.form.id_area) errores['id_area'] = 'Selecciona un área';

    if (Object.keys(errores).length > 0) {
      this.erroresFormulario = errores;
      return;
    }

    if (this.modoEditar) {
      this.svc.editarModulo(this.moduloSeleccionado.id_m, this.form).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
          this.mostrarNotificacion('Modulo actualizado correctamente');
        },
        error: (err) => {
          this.aplicarErroresFormulario(err, 'Error al actualizar modulo');
        }
      });
    } else {
      this.svc.crearModulo(this.form).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
          this.mostrarNotificacion('Modulo creado correctamente');
        },
        error: (err) => {
          this.aplicarErroresFormulario(err, 'Error al crear modulo');
        }
      });
    }
  }
}
