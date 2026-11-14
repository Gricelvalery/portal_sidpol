import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../../core/api/dashboard.service';
import { SubmoduloService } from '../../../core/api/submodulo.service';
import { Dashboard, DashboardPayload, Submodulo } from '../../../core/models';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import { esUrlDashboardPermitida } from '../../../core/seguridad/dashboard-url';
import { CeldaTabla, ColumnaTabla, DataTable } from '../../../shared/components/data-table/data-table';
import { Modal } from '../../../shared/components/modal/modal';
import { filtrarPorTexto } from '../../../shared/utils/busqueda';
import { EstadoFormulario } from '../../../shared/utils/estado-formulario';

@Component({
  selector: 'app-dashboards',
  imports: [FormsModule, DataTable, CeldaTabla, Modal],
  templateUrl: './dashboards.html',
  styleUrls: ['../../../shared/styles/crud.css', './dashboards.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    filtrarPorTexto(this.dashboards(), this.busqueda(), (d) => [d.nombre_d, d.nombre_sm, d.nombre_m]));

  protected readonly columnas: ColumnaTabla<Dashboard>[] = [
    { titulo: 'Nombre', valor: (d) => d.nombre_d },
    { titulo: 'Link', celda: 'link' },
    { titulo: 'Submódulo', valor: (d) => d.nombre_sm, siVacio: '—' },
    { titulo: 'Módulo', valor: (d) => d.nombre_m, siVacio: '—' },
    { titulo: 'Acciones', celda: 'acciones' }
  ];

  protected readonly modalAbierto = signal(false);
  protected readonly editando = signal<Dashboard | null>(null);
  protected readonly estado = new EstadoFormulario();
  protected form: DashboardPayload = { nombre_d: '', link_d: '', submodulos_id_sm: null };

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    forkJoin({ dashboards: this.dashboardService.listar(), submodulos: this.submoduloService.listar() }).subscribe({
      next: ({ dashboards, submodulos }) => {
        this.dashboards.set(dashboards);
        this.submodulos.set(submodulos);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  protected abrirAgregar(): void {
    this.editando.set(null);
    this.form = { nombre_d: '', link_d: '', submodulos_id_sm: null };
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected abrirEditar(d: Dashboard): void {
    this.editando.set(d);
    // Se reenvían las páginas existentes para no borrarlas al editar
    this.form = { nombre_d: d.nombre_d, link_d: d.link_d, submodulos_id_sm: d.submodulos_id_sm, paginas: d.paginas ?? [] };
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.estado.reiniciar();
  }

  protected guardar(): void {
    const link = this.form.link_d.trim();
    const errorLink = !link
      ? 'El link es requerido'
      : !esUrlDashboardPermitida(link)
        ? 'El link debe ser un enlace https de Power BI (app.powerbi.com)'
        : null;

    const valido = this.estado.validar({
      ...(!this.form.nombre_d.trim() && { nombre_d: 'El nombre es requerido' }),
      ...(errorLink && { link_d: errorLink }),
      ...(!this.form.submodulos_id_sm && { submodulos_id_sm: 'Selecciona un submódulo' })
    });
    if (!valido) return;

    const actual = this.editando();
    const peticion = actual ? this.dashboardService.editar(actual.id_d, this.form) : this.dashboardService.crear(this.form);
    peticion.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarDatos();
        this.notificaciones.exito(actual ? 'Dashboard actualizado correctamente' : 'Dashboard creado correctamente');
      },
      error: (err: unknown) => this.estado.aplicarRespuesta(err, actual ? 'Error al editar dashboard' : 'Error al crear dashboard')
    });
  }
}
