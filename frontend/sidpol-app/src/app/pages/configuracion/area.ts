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
    this.modalAbierto = true;
  }

  abrirEditar(a: any) {
    this.modoEditar = true;
    this.areaSeleccionada = a;
    this.form = { nombre_area: a.nombre_area, descripcion_area: a.descripcion_area };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }

  guardar() {
    if (!this.form.nombre_area) return;

    if (this.modoEditar) {
      this.svc.editarArea(this.areaSeleccionada.id_area, this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarDatos(); }
      });
    } else {
      this.svc.crearArea(this.form).subscribe({
        next: () => { this.cerrarModal(); this.cargarDatos(); }
      });
    }
  }
}