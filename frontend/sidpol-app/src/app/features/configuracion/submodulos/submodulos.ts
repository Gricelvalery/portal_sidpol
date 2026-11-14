import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ModuloService } from '../../../core/api/modulo.service';
import { SubmoduloService } from '../../../core/api/submodulo.service';
import { Modulo, Submodulo } from '../../../core/models';
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
  nombre_sm: { required: 'El nombre es requerido', soloEspacios: 'El nombre es requerido' },
  descripcion_sm: {
    required: 'La descripción es requerida',
    soloEspacios: 'La descripción es requerida',
  },
  modulos_id_m: { required: 'Selecciona un módulo' },
};

@Component({
  selector: 'app-submodulos',
  imports: [ReactiveFormsModule, DataTable, CeldaTabla, Modal],
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
  protected readonly form = new FormGroup({
    nombre_sm: new FormControl('', { nonNullable: true, validators: textoObligatorio }),
    descripcion_sm: new FormControl('', { nonNullable: true, validators: textoObligatorio }),
    modulos_id_m: new FormControl<number | null>(null, { validators: Validators.required }),
  });

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
    this.form.reset();
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected abrirEditar(s: Submodulo): void {
    this.editando.set(s);
    this.form.reset({
      nombre_sm: s.nombre_sm,
      descripcion_sm: s.descripcion_sm ?? '',
      modulos_id_m: s.modulos_id_m,
    });
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.estado.reiniciar();
  }

  protected guardar(): void {
    if (!this.estado.validarFormulario(this.form, MENSAJES)) return;
    const { nombre_sm, descripcion_sm, modulos_id_m } = this.form.getRawValue();
    const datos = {
      nombre_sm: nombre_sm.trim(),
      descripcion_sm: descripcion_sm.trim(),
      modulos_id_m,
    };

    const actual = this.editando();
    const peticion = actual
      ? this.submoduloService.editar(actual.id_sm, datos)
      : this.submoduloService.crear(datos);
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
