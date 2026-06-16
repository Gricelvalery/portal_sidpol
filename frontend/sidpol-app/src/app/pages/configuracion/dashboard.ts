import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModulosService } from '../../services/modulos';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  dashboards: any[] = [];
  dashboardsFiltrados: any[] = [];
  submodulos: any[] = [];
  cargando = true;
  busqueda = '';

  modalAbierto = false;
  modoEditar = false;
  dashboardSeleccionado: any = null;
  erroresFormulario: Record<string, string> = {};
  errorFormularioGeneral = '';
  form = { nombre_d: '', link_d: '', submodulos_id_sm: null as any };

  constructor(private svc: ModulosService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.svc.getDashboards().subscribe({
      next: (data) => {
        this.dashboards = data;
        this.dashboardsFiltrados = data;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; }
    });
    this.svc.getSubmodulos().subscribe({
      next: (data) => { this.submodulos = data; }
    });
  }

  buscar() {
    const q = this.busqueda.toLowerCase();
    this.dashboardsFiltrados = this.dashboards.filter(d =>
      d.nombre_d.toLowerCase().includes(q) ||
      (d.nombre_sm || '').toLowerCase().includes(q) ||
      (d.nombre_m || '').toLowerCase().includes(q)
    );
  }

  abrirAgregar() {
    this.modoEditar = false;
    this.form = { nombre_d: '', link_d: '', submodulos_id_sm: null };
    this.erroresFormulario = {};
    this.errorFormularioGeneral = '';
    this.modalAbierto = true;
  }

  abrirEditar(d: any) {
    this.modoEditar = true;
    this.dashboardSeleccionado = d;
    this.form = { nombre_d: d.nombre_d, link_d: d.link_d, submodulos_id_sm: d.submodulos_id_sm };
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

  private esUrlValida(valor: string): boolean {
    try {
      const url = new URL(valor);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
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
    const link = this.form.link_d.trim();

    if (!this.form.nombre_d.trim()) errores['nombre_d'] = 'El nombre es requerido';
    if (!link) {
      errores['link_d'] = 'El link es requerido';
    } else if (!this.esUrlValida(link)) {
      errores['link_d'] = 'Ingresa un link válido que empiece con http:// o https://';
    }
    if (!this.form.submodulos_id_sm) errores['submodulos_id_sm'] = 'Selecciona un submódulo';

    if (Object.keys(errores).length > 0) {
      this.erroresFormulario = errores;
      return;
    }

    if (this.modoEditar) {
      this.svc.editarDashboard(this.dashboardSeleccionado.id_d, this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarDatos(); },
        error: (err) => { this.aplicarErroresFormulario(err, 'Error al editar dashboard'); }
      });
    } else {
      this.svc.crearDashboard(this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarDatos(); },
        error: (err) => { this.aplicarErroresFormulario(err, 'Error al crear dashboard'); }
      });
    }
  }
}
