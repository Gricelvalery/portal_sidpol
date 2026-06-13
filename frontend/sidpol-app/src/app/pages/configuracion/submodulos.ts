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
    this.modalAbierto = true;
  }

  abrirEditar(s: any) {
    this.modoEditar = true;
    this.submoduloSeleccionado = s;
    this.form = { nombre_sm: s.nombre_sm, descripcion_sm: s.descripcion_sm, modulos_id_m: s.modulos_id_m };
    this.modalAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
  }

  guardar() {
    if (!this.form.nombre_sm || !this.form.descripcion_sm || !this.form.modulos_id_m) return;

    if (this.modoEditar) {
      this.svc.editarSubmodulo(this.submoduloSeleccionado.id_sm, this.form).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
          this.mostrarNotificacion('Submodulo actualizado correctamente');
        },
        error: () => {
          this.mostrarNotificacion('Error al actualizar submodulo', 'error');
        }
      });
    } else {
      this.svc.crearSubmodulo(this.form).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargarDatos();
          this.mostrarNotificacion('Submodulo creado correctamente');
        },
        error: () => {
          this.mostrarNotificacion('Error al crear submodulo', 'error');
        }
      });
    }
  }
}
