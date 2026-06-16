import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModulosService } from '../../services/modulos';

@Component({
  selector: 'app-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './area.html',
  styleUrl: './area.css'
})
export class Area implements OnInit {
  areas: any[] = [];
  areasFiltradas: any[] = [];
  cargando = true;
  busqueda = '';

  modalAbierto = false;
  modoEditar = false;
  areaSeleccionada: any = null;
  erroresFormulario: Record<string, string> = {};
  errorFormularioGeneral = '';
  form = { nombre_area: '', descripcion_area: '' };

  constructor(private svc: ModulosService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.svc.getAreas().subscribe({
      next: (data) => {
        this.areas = data;
        this.areasFiltradas = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; }
    });
  }

  buscar() {
    const q = this.busqueda.toLowerCase();
    this.areasFiltradas = this.areas.filter(a =>
      a.nombre_area.toLowerCase().includes(q) ||
      (a.descripcion_area || '').toLowerCase().includes(q)
    );
  }

  abrirAgregar() {
    this.modoEditar = false;
    this.form = { nombre_area: '', descripcion_area: '' };
    this.erroresFormulario = {};
    this.errorFormularioGeneral = '';
    this.modalAbierto = true;
  }

  abrirEditar(a: any) {
    this.modoEditar = true;
    this.areaSeleccionada = a;
    this.form = { nombre_area: a.nombre_area, descripcion_area: a.descripcion_area };
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

    if (!this.form.nombre_area.trim()) errores['nombre_area'] = 'El nombre es requerido';
    if (!this.form.descripcion_area.trim()) errores['descripcion_area'] = 'La descripción es requerida';

    if (Object.keys(errores).length > 0) {
      this.erroresFormulario = errores;
      return;
    }

    if (this.modoEditar) {
      this.svc.editarArea(this.areaSeleccionada.id_area, this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarDatos(); },
        error: (err) => { this.aplicarErroresFormulario(err, 'Error al editar dependencia'); }
      });
    } else {
      this.svc.crearArea(this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarDatos(); },
        error: (err) => { this.aplicarErroresFormulario(err, 'Error al crear dependencia'); }
      });
    }
  }
}
