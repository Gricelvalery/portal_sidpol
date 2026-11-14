import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ModuloService } from '../../../core/api/modulo.service';
import { SubmoduloService } from '../../../core/api/submodulo.service';
import { Modulo, Submodulo, SubmoduloPayload } from '../../../core/models';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import {
  CeldaTabla,
  ColumnaTabla,
  DataTable,
} from '../../../shared/components/data-table/data-table';
import { Modal } from '../../../shared/components/modal/modal';
import { filtrarPorTexto } from '../../../shared/utils/busqueda';
import { EstadoFormulario } from '../../../shared/utils/estado-formulario';

@Component({
  selector: 'app-submodulos',
  imports: [FormsModule, DataTable, CeldaTabla, Modal],
  templateUrl: './submodulos.html',
  styleUrls: ['../../../shared/styles/crud.css', './submodulos.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Submodulos implements OnInit {
  private readonly submoduloService = inject(SubmoduloService);
  private readonly moduloService = inject(ModuloService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly submodulos = signal<Submodulo[]>([]);
  protected readonly modulos = signal<Modulo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly busqueda = signal('');
  protected readonly filtrados = computed(() =>
    filtrarPorTexto(this.submodulos(), this.busqueda(), (s) => [s.nombre_sm, s.descripcion_sm]),
  );

  protected readonly columnas: ColumnaTabla<Submodulo>[] = [
    { titulo: 'Nombre', valor: (s) => s.nombre_sm },
    { titulo: 'Descripción', valor: (s) => s.descripcion_sm },
    { titulo: 'Módulo', valor: (s) => s.nombre_m, siVacio: '—' },
    { titulo: 'Acciones', celda: 'acciones' },
  ];

  protected readonly modalAbierto = signal(false);
  protected readonly editando = signal<Submodulo | null>(null);
  protected readonly estado = new EstadoFormulario();
  protected form: SubmoduloPayload = { nombre_sm: '', descripcion_sm: '', modulos_id_m: null };

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    forkJoin({
      submodulos: this.submoduloService.listar(),
      modulos: this.moduloService.listar(),
    }).subscribe({
      next: ({ submodulos, modulos }) => {
        this.submodulos.set(submodulos);
        this.modulos.set(modulos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected abrirAgregar(): void {
    this.editando.set(null);
    this.form = { nombre_sm: '', descripcion_sm: '', modulos_id_m: null };
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected abrirEditar(s: Submodulo): void {
    this.editando.set(s);
    this.form = {
      nombre_sm: s.nombre_sm,
      descripcion_sm: s.descripcion_sm ?? '',
      modulos_id_m: s.modulos_id_m,
    };
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.estado.reiniciar();
  }

  protected guardar(): void {
    const valido = this.estado.validar({
      ...(!this.form.nombre_sm.trim() && { nombre_sm: 'El nombre es requerido' }),
      ...(!this.form.descripcion_sm.trim() && { descripcion_sm: 'La descripción es requerida' }),
      ...(!this.form.modulos_id_m && { modulos_id_m: 'Selecciona un módulo' }),
    });
    if (!valido) return;

    const actual = this.editando();
    const peticion = actual
      ? this.submoduloService.editar(actual.id_sm, this.form)
      : this.submoduloService.crear(this.form);
    peticion.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatos();
        this.notificaciones.exito(
          actual ? 'Submodulo actualizado correctamente' : 'Submodulo creado correctamente',
        );
      },
      error: (err: unknown) =>
        this.estado.aplicarRespuesta(
          err,
          actual ? 'Error al actualizar submodulo' : 'Error al crear submodulo',
        ),
    });
  }
}
