import { Component, OnInit } from '@angular/core';
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

  modalAbierto = false;
  modoEditar = false;
  moduloSeleccionado: any = null;
  form = { nombre_m: '', descripcion_m: '', id_area: null as any };

  constructor(private svc: ModulosService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.svc.getModulos().subscribe({
      next: (data) => {
        this.modulos = data;
        this.modulosFiltrados = data;
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
    this.svc.getAreas().subscribe({
      next: (data) => { this.areas = data; }
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
    this.modalAbierto = true;
  }

  abrirEditar(m: any) {
    this.modoEditar = true;
    this.moduloSeleccionado = m;
    this.form = { nombre_m: m.nombre_m, descripcion_m: m.descripcion_m, id_area: m.id_area };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }

  guardar() {
    if (!this.form.nombre_m || !this.form.descripcion_m) return;

    if (this.modoEditar) {
      this.svc.editarModulo(this.moduloSeleccionado.id_m, this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarDatos(); }
      });
    } else {
      this.svc.crearModulo(this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarDatos(); }
      });
    }
  }
}