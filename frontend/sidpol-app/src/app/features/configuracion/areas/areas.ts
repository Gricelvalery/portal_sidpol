import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AreaService } from '../../../core/api/area.service';
import { Area } from '../../../core/models';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import {
  CeldaTabla,
  ColumnaTabla,
  DataTable,
} from '../../../shared/components/data-table/data-table';
import { Modal } from '../../../shared/components/modal/modal';
import { filtrarPorTexto } from '../../../shared/utils/busqueda';
import { EstadoFormulario, MensajesValidacion } from '../../../shared/utils/estado-formulario';
import { textoObligatorio } from '../../../shared/validators/texto.validators';

const MENSAJES: MensajesValidacion = {
  nombre_area: { required: 'El nombre es requerido', soloEspacios: 'El nombre es requerido' },
  descripcion_area: {
    required: 'La descripción es requerida',
    soloEspacios: 'La descripción es requerida',
  },
};

/** Áreas (en el menú aparece como "Dependencias"). */
@Component({
  selector: 'app-areas',
  imports: [ReactiveFormsModule, DataTable, CeldaTabla, Modal],
  templateUrl: './areas.html',
  styleUrls: ['../../../shared/styles/crud.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Areas implements OnInit {
  private readonly areaService = inject(AreaService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly areas = signal<Area[]>([]);
  protected readonly cargando = signal(true);
  protected readonly busqueda = signal('');
  protected readonly filtradas = computed(() =>
    filtrarPorTexto(this.areas(), this.busqueda(), (a) => [a.nombre_area, a.descripcion_area]),
  );

  protected readonly columnas: ColumnaTabla<Area>[] = [
    { titulo: 'Nombre', valor: (a) => a.nombre_area },
    { titulo: 'Descripción', valor: (a) => a.descripcion_area },
    { titulo: 'Acciones', celda: 'acciones' },
  ];

  protected readonly modalAbierto = signal(false);
  protected readonly editando = signal<Area | null>(null);
  protected readonly estado = new EstadoFormulario();
  protected readonly form = new FormGroup({
    nombre_area: new FormControl('', { nonNullable: true, validators: textoObligatorio }),
    descripcion_area: new FormControl('', { nonNullable: true, validators: textoObligatorio }),
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.areaService.listar().subscribe({
      next: (areas) => {
        this.areas.set(areas);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected abrirAgregar(): void {
    this.editando.set(null);
    this.form.reset();
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected abrirEditar(a: Area): void {
    this.editando.set(a);
    this.form.reset({ nombre_area: a.nombre_area, descripcion_area: a.descripcion_area ?? '' });
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.estado.reiniciar();
  }

  protected guardar(): void {
    if (!this.estado.validarFormulario(this.form, MENSAJES)) return;
    const { nombre_area, descripcion_area } = this.form.getRawValue();
    const datos = { nombre_area: nombre_area.trim(), descripcion_area: descripcion_area.trim() };

    const actual = this.editando();
    const peticion = actual
      ? this.areaService.editar(actual.id_area, datos)
      : this.areaService.crear(datos);
    peticion.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatos();
        this.notificaciones.exito(
          actual ? 'Área actualizada correctamente' : 'Área creada correctamente',
        );
      },
      error: (err: unknown) =>
        this.estado.aplicarRespuesta(
          err,
          actual ? 'Error al actualizar área' : 'Error al crear área',
        ),
    });
  }
}
