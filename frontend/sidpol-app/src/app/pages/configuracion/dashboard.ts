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
    this.modalAbierto = true;
  }

  abrirEditar(d: any) {
    this.modoEditar = true;
    this.dashboardSeleccionado = d;
    this.form = { nombre_d: d.nombre_d, link_d: d.link_d, submodulos_id_sm: d.submodulos_id_sm };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }

  guardar() {
    if (!this.form.nombre_d || !this.form.link_d || !this.form.submodulos_id_sm) return;

    if (this.modoEditar) {
      this.svc.editarDashboard(this.dashboardSeleccionado.id_d, this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarDatos(); }
      });
    } else {
      this.svc.crearDashboard(this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarDatos(); }
      });
    }
  }
}