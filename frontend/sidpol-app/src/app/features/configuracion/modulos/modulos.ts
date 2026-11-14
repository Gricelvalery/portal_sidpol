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
import { AreaService } from '../../../core/api/area.service';
import { ModuloService } from '../../../core/api/modulo.service';
import { Area, Modulo, ModuloPayload } from '../../../core/models';
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
  selector: 'app-modulos',
  imports: [FormsModule, DataTable, CeldaTabla, Modal],
  templateUrl: './modulos.html',
  styleUrls: ['../../../shared/styles/crud.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modulos implements OnInit {
  private readonly moduloService = inject(ModuloService);
  private readonly areaService = inject(AreaService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly modulos = signal<Modulo[]>([]);
  protected readonly areas = signal<Area[]>([]);
  protected readonly cargando = signal(true);
  protected readonly busqueda = signal('');
  protected readonly filtrados = computed(() =>
    filtrarPorTexto(this.modulos(), this.busqueda(), (m) => [m.nombre_m, m.descripcion_m]),
  );

  protected readonly columnas: ColumnaTabla<Modulo>[] = [
    { titulo: 'Nombre', valor: (m) => m.nombre_m },
    { titulo: 'Descripción', valor: (m) => m.descripcion_m },
    { titulo: 'Área', valor: (m) => m.nombre_area, siVacio: '—' },
    { titulo: 'Acciones', celda: 'acciones' },
  ];

  protected readonly modalAbierto = signal(false);
  protected readonly editando = signal<Modulo | null>(null);
  protected readonly estado = new EstadoFormulario();
  protected form: ModuloPayload = { nombre_m: '', descripcion_m: '', id_area: null };

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    forkJoin({ modulos: this.moduloService.listar(), areas: this.areaService.listar() }).subscribe({
      next: ({ modulos, areas }) => {
        this.modulos.set(modulos);
        this.areas.set(areas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected abrirAgregar(): void {
    this.editando.set(null);
    this.form = { nombre_m: '', descripcion_m: '', id_area: null };
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected abrirEditar(m: Modulo): void {
    this.editando.set(m);
    this.form = { nombre_m: m.nombre_m, descripcion_m: m.descripcion_m, id_area: m.id_area };
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.estado.reiniciar();
  }

  protected guardar(): void {
    const valido = this.estado.validar({
      ...(!this.form.nombre_m.trim() && { nombre_m: 'El nombre es requerido' }),
      ...(!this.form.descripcion_m.trim() && { descripcion_m: 'La descripción es requerida' }),
      ...(!this.form.id_area && { id_area: 'Selecciona un área' }),
    });
    if (!valido) return;

    const actual = this.editando();
    const peticion = actual
      ? this.moduloService.editar(actual.id_m, this.form)
      : this.moduloService.crear(this.form);
    peticion.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatos();
        this.notificaciones.exito(
          actual ? 'Modulo actualizado correctamente' : 'Modulo creado correctamente',
        );
      },
      error: (err: unknown) =>
        this.estado.aplicarRespuesta(
          err,
          actual ? 'Error al actualizar modulo' : 'Error al crear modulo',
        ),
    });
  }
}
