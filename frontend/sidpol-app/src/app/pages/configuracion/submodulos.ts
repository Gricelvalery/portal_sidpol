import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModulosService } from '../../services/modulos';

@Component({
  selector: 'app-submodulos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submodulos.html',
  styleUrl: './submodulos.css'
})
export class Submodulos implements OnInit {
  submodulos: any[] = [];
  submodulosFiltrados: any[] = [];
  modulos: any[] = [];
  cargando = true;
  busqueda = '';
  notificacion = '';
  notificacionVisible = false;
  notificacionTipo = 'exito';

  modalAbierto = false;
  modoEditar = false;
  submoduloSeleccionado: any = null;
  erroresFormulario: Record<string, string> = {};
  errorFormularioGeneral = '';
  form = { nombre_sm: '', descripcion_sm: '', modulos_id_m: null as any };

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
    this.svc.getSubmodulos().subscribe({
      next: (data) => {
        this.submodulos = data;
        this.submodulosFiltrados = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
    this.svc.getModulos().subscribe({
      next: (data) => {
        this.modulos = data;
        this.cdr.detectChanges();
      }
    });
  }

  buscar() {
    const q = this.busqueda.toLowerCase();
    this.submodulosFiltrados = this.submodulos.filter(s =>
      s.nombre_sm.toLowerCase().includes(q) ||
      (s.descripcion_sm || '').toLowerCase().includes(q)
    );
  }

  abrirAgregar() {
    this.modoEditar = false;
    this.form = { nombre_sm: '', descripcion_sm: '', modulos_id_m: null };
    this.erroresFormulario = {};
    this.errorFormularioGeneral = '';
    this.modalAbierto = true;
  }

  abrirEditar(s: any) {
    this.modoEditar = true;
    this.submoduloSeleccionado = s;
    this.form = { nombre_sm: s.nombre_sm, descripcion_sm: s.descripcion_sm, modulos_id_m: s.modulos_id_m };
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

    if (!this.form.nombre_sm.trim()) errores['nombre_sm'] = 'El nombre es requerido';
    if (!this.form.descripcion_sm.trim()) errores['descripcion_sm'] = 'La descripción es requerida';
    if (!this.form.modulos_id_m) errores['modulos_id_m'] = 'Selecciona un módulo';

    if (Object.keys(errores).length > 0) {
      this.erroresFormulario = errores;
      return;
    }

    if (this.modoEditar) {
      this.svc.editarSubmodulo(this.submoduloSeleccionado.id_sm, this.form).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
          this.mostrarNotificacion('Submodulo actualizado correctamente');
        },
        error: (err) => {
          this.aplicarErroresFormulario(err, 'Error al actualizar submodulo');
        }
      });
    } else {
      this.svc.crearSubmodulo(this.form).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
          this.mostrarNotificacion('Submodulo creado correctamente');
        },
        error: (err) => {
          this.aplicarErroresFormulario(err, 'Error al crear submodulo');
        }
      });
    }
  }
}
