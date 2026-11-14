import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../../core/api/dashboard.service';
import { SubmoduloService } from '../../../core/api/submodulo.service';
import { Dashboard, PaginaDashboard, Submodulo } from '../../../core/models';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import { esUrlDashboardPermitida } from '../../../core/seguridad/dashboard-url';
import {
  CeldaTabla,
  ColumnaTabla,
  DataTable,
} from '../../../shared/components/data-table/data-table';
import { Modal } from '../../../shared/components/modal/modal';
import { filtrarPorTexto } from '../../../shared/utils/busqueda';
import { EstadoFormulario, MensajesValidacion } from '../../../shared/utils/estado-formulario';
import { textoObligatorio } from '../../../shared/validators/texto.validators';

/** El link solo puede ser https de un dominio permitido (Power BI). Vacío lo maneja required. */
const linkPowerBi: ValidatorFn = (control) => {
  const valor = String(control.value ?? '').trim();
  return valor && !esUrlDashboardPermitida(valor) ? { powerBi: true } : null;
};

const MENSAJES: MensajesValidacion = {
  nombre_d: { required: 'El nombre es requerido', soloEspacios: 'El nombre es requerido' },
  link_d: {
    required: 'El link es requerido',
    soloEspacios: 'El link es requerido',
    powerBi: 'El link debe ser un enlace https de Power BI (app.powerbi.com)',
  },
  submodulos_id_sm: { required: 'Selecciona un submódulo' },
};

@Component({
  selector: 'app-dashboards',
  imports: [ReactiveFormsModule, DataTable, CeldaTabla, Modal],
  templateUrl: './dashboards.html',
  styleUrls: ['../../../shared/styles/crud.css', './dashboards.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboards implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly submoduloService = inject(SubmoduloService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly dashboards = signal<Dashboard[]>([]);
  protected readonly submodulos = signal<Submodulo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly busqueda = signal('');
  protected readonly filtrados = computed(() =>
    filtrarPorTexto(this.dashboards(), this.busqueda(), (d) => [
      d.nombre_d,
      d.nombre_sm,
      d.nombre_m,
    ]),
  );

  protected readonly columnas: ColumnaTabla<Dashboard>[] = [
    { titulo: 'Nombre', valor: (d) => d.nombre_d },
    { titulo: 'Link', celda: 'link' },
    { titulo: 'Submódulo', valor: (d) => d.nombre_sm, siVacio: '—' },
    { titulo: 'Módulo', valor: (d) => d.nombre_m, siVacio: '—' },
    { titulo: 'Acciones', celda: 'acciones' },
  ];

  protected readonly modalAbierto = signal(false);
  protected readonly editando = signal<Dashboard | null>(null);
  protected readonly estado = new EstadoFormulario();
  protected readonly form = new FormGroup({
    nombre_d: new FormControl('', { nonNullable: true, validators: textoObligatorio }),
    link_d: new FormControl('', {
      nonNullable: true,
      validators: [...textoObligatorio, linkPowerBi],
    }),
    submodulos_id_sm: new FormControl<number | null>(null, { validators: Validators.required }),
  });
  /** Páginas del dashboard que se edita: se reenvían para no borrarlas. */
  private paginas: PaginaDashboard[] = [];

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    forkJoin({
      dashboards: this.dashboardService.listar(),
      submodulos: this.submoduloService.listar(),
    }).subscribe({
      next: ({ dashboards, submodulos }) => {
        this.dashboards.set(dashboards);
        this.submodulos.set(submodulos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected abrirAgregar(): void {
    this.editando.set(null);
    this.form.reset();
    this.paginas = [];
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected abrirEditar(d: Dashboard): void {
    this.editando.set(d);
    // Se reenvían las páginas existentes para no borrarlas al editar
    this.form.reset({
      nombre_d: d.nombre_d,
      link_d: d.link_d,
      submodulos_id_sm: d.submodulos_id_sm,
    });
    this.paginas = d.paginas ?? [];
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.estado.reiniciar();
  }

  protected guardar(): void {
    if (!this.estado.validarFormulario(this.form, MENSAJES)) return;
    const { nombre_d, link_d, submodulos_id_sm } = this.form.getRawValue();
    const datos = {
      nombre_d: nombre_d.trim(),
      link_d: link_d.trim(),
      submodulos_id_sm,
      ...(this.editando() && { paginas: this.paginas }),
    };

    const actual = this.editando();
    const peticion = actual
      ? this.dashboardService.editar(actual.id_d, datos)
      : this.dashboardService.crear(datos);
    peticion.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatos();
        this.notificaciones.exito(
          actual ? 'Dashboard actualizado correctamente' : 'Dashboard creado correctamente',
        );
      },
      error: (err: unknown) =>
        this.estado.aplicarRespuesta(
          err,
          actual ? 'Error al editar dashboard' : 'Error al crear dashboard',
        ),
    });
  }
}
