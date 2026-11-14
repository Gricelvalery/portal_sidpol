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
import { DashboardService } from '../../../core/api/dashboard.service';
import { PosicionService } from '../../../core/api/posicion.service';
import { SubmoduloService } from '../../../core/api/submodulo.service';
import { UsuarioService } from '../../../core/api/usuario.service';
import { Dashboard, Posicion, Rol, Submodulo, Usuario } from '../../../core/models';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';
import {
  CeldaTabla,
  ColumnaTabla,
  DataTable,
} from '../../../shared/components/data-table/data-table';
import { Modal } from '../../../shared/components/modal/modal';
import { filtrarPorTexto } from '../../../shared/utils/busqueda';
import {
  ErroresCampos,
  EstadoFormulario,
  mensajeErrorNegocio,
} from '../../../shared/utils/estado-formulario';

interface FormUsuario {
  nombres_u: string;
  apellido_paterno_u: string;
  apellido_materno_u: string;
  contrasenia_u: string;
  rol_u: Rol;
  id_posicion: number | null;
  autorizado: boolean;
}

interface GrupoDashboards {
  key: string;
  dashboards: Dashboard[];
}

// Misma regla que el backend: letras y espacios simples ("Juan Carlos", "De la Cruz")
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+( [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;
const limpiarEspacios = (v: string) => (v || '').replace(/\s+/g, ' ').trim();
const formVacio = (): FormUsuario => ({
  nombres_u: '',
  apellido_paterno_u: '',
  apellido_materno_u: '',
  contrasenia_u: '',
  rol_u: 'user',
  id_posicion: null,
  autorizado: false,
});

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, DataTable, CeldaTabla, Modal],
  templateUrl: './usuarios.html',
  styleUrls: ['../../../shared/styles/crud.css', './usuarios.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Usuarios implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly posicionService = inject(PosicionService);
  private readonly dashboardService = inject(DashboardService);
  private readonly submoduloService = inject(SubmoduloService);
  private readonly notificaciones = inject(NotificacionService);

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly posiciones = signal<Posicion[]>([]);
  protected readonly dashboards = signal<Dashboard[]>([]);
  /** Los submódulos de configuración son exclusivos del admin: no se asignan. */
  protected readonly submodulosAsignables = signal<Submodulo[]>([]);
  protected readonly cargando = signal(true);
  protected readonly busqueda = signal('');
  protected readonly filtrados = computed(() =>
    filtrarPorTexto(this.usuarios(), this.busqueda(), (u) => [
      u.nombres_u,
      u.apellido_paterno_u,
      u.apellido_materno_u,
      u.username,
      u.correo_u,
      u.nombre_area,
    ]),
  );

  protected readonly columnas: ColumnaTabla<Usuario>[] = [
    { titulo: 'Nombres', valor: (u) => u.nombres_u },
    { titulo: 'Apellidos', valor: (u) => `${u.apellido_paterno_u} ${u.apellido_materno_u || ''}` },
    { titulo: 'Usuario', valor: (u) => u.username },
    { titulo: 'Email', valor: (u) => u.correo_u },
    { titulo: 'Autorizado', celda: 'autorizado' },
    { titulo: 'Posición', valor: (u) => u.nombre_posicion, siVacio: '—' },
    { titulo: 'Área', valor: (u) => u.nombre_area, siVacio: '—' },
    { titulo: 'Rol', celda: 'rol' },
    { titulo: 'Acciones', celda: 'acciones', claseCelda: 'acciones' },
  ];

  protected readonly dashboardsAgrupados = computed<GrupoDashboards[]>(() => {
    const grupos: GrupoDashboards[] = [];
    for (const d of this.dashboards()) {
      const key = `${d.nombre_m} — ${d.nombre_sm}`;
      let grupo = grupos.find((g) => g.key === key);
      if (!grupo) {
        grupo = { key, dashboards: [] };
        grupos.push(grupo);
      }
      grupo.dashboards.push(d);
    }
    return grupos;
  });

  protected readonly seleccionado = signal<Usuario | null>(null);
  protected readonly modalAbierto = signal(false);
  protected readonly modoEditar = signal(false);
  protected readonly modalPermisosAbierto = signal(false);
  protected readonly modalEliminarAbierto = signal(false);
  protected readonly estado = new EstadoFormulario();
  protected form: FormUsuario = formVacio();

  protected readonly permisosDashboards = signal<ReadonlySet<number>>(new Set());
  protected readonly permisosSubmodulos = signal<ReadonlySet<number>>(new Set());

  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    forkJoin({
      usuarios: this.usuarioService.listar(),
      posiciones: this.posicionService.listar(),
      dashboards: this.dashboardService.listar(),
      submodulos: this.submoduloService.listar(),
    }).subscribe({
      next: ({ usuarios, posiciones, dashboards, submodulos }) => {
        this.usuarios.set(usuarios);
        this.posiciones.set(posiciones);
        this.dashboards.set(dashboards);
        this.submodulosAsignables.set(
          submodulos.filter((s) => !(s.ruta ?? '').startsWith('configuracion/')),
        );
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected nombreCompleto(u: Usuario | null): string {
    return [u?.nombres_u, u?.apellido_paterno_u, u?.apellido_materno_u].filter(Boolean).join(' ');
  }

  protected esAdminUsuario(u: Usuario | null): boolean {
    return u?.rol_u === 'admin';
  }

  // ---------- Agregar / editar ----------

  protected abrirAgregar(): void {
    this.modoEditar.set(false);
    this.form = formVacio();
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected abrirEditar(u: Usuario): void {
    this.modoEditar.set(true);
    this.seleccionado.set(u);
    this.form = {
      nombres_u: u.nombres_u,
      apellido_paterno_u: u.apellido_paterno_u,
      apellido_materno_u: u.apellido_materno_u || '',
      contrasenia_u: '',
      rol_u: u.rol_u,
      id_posicion: u.id_posicion,
      autorizado: u.autorizado || false,
    };
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.estado.reiniciar();
  }

  private validarFormulario(): ErroresCampos {
    const f = this.form;
    f.nombres_u = limpiarEspacios(f.nombres_u);
    f.apellido_paterno_u = limpiarEspacios(f.apellido_paterno_u);
    f.apellido_materno_u = limpiarEspacios(f.apellido_materno_u);

    const errores: ErroresCampos = {};
    if (!f.nombres_u) errores['nombres_u'] = 'Los nombres son requeridos';
    else if (!SOLO_LETRAS.test(f.nombres_u))
      errores['nombres_u'] = 'Los nombres solo deben contener letras';

    if (!f.apellido_paterno_u) errores['apellido_paterno_u'] = 'El apellido paterno es requerido';
    else if (!SOLO_LETRAS.test(f.apellido_paterno_u))
      errores['apellido_paterno_u'] = 'El apellido paterno solo debe contener letras';

    if (f.apellido_materno_u && !SOLO_LETRAS.test(f.apellido_materno_u)) {
      errores['apellido_materno_u'] = 'El apellido materno solo debe contener letras';
    }
    if (!f.id_posicion) errores['id_posicion'] = 'Selecciona una posición';

    if (!this.modoEditar()) {
      if (!f.contrasenia_u) errores['contrasenia_u'] = 'La contraseña es requerida';
      else if (f.contrasenia_u.length < 6 || f.contrasenia_u.length > 72) {
        errores['contrasenia_u'] = 'La contraseña debe tener entre 6 y 72 caracteres';
      }
    }
    return errores;
  }

  protected guardar(): void {
    if (!this.estado.validar(this.validarFormulario())) return;

    const {
      nombres_u,
      apellido_paterno_u,
      apellido_materno_u,
      contrasenia_u,
      rol_u,
      id_posicion,
      autorizado,
    } = this.form;
    const actual = this.seleccionado();

    if (this.modoEditar() && actual) {
      this.usuarioService
        .editar(actual.id_u, {
          nombres_u,
          apellido_paterno_u,
          apellido_materno_u,
          rol_u,
          id_posicion,
          autorizado,
        })
        .subscribe({
          next: () => {
            this.cerrarModal();
            this.cargarDatos();
            this.notificaciones.exito('Usuario actualizado correctamente');
          },
          error: (err: unknown) => this.estado.aplicarRespuesta(err, 'Error al editar usuario'),
        });
      return;
    }

    // Todo usuario nuevo se crea con rol 'user' y sin permisos (lo fuerza el backend)
    this.usuarioService
      .crear({
        nombres_u,
        apellido_paterno_u,
        apellido_materno_u,
        contrasenia_u,
        id_posicion,
        autorizado,
      })
      .subscribe({
        next: ({ usuario }) => {
          this.cerrarModal();
          this.cargarDatos();
          this.notificaciones.exito(`Usuario creado: ${usuario.username} (${usuario.correo_u})`);
        },
        error: (err: unknown) => this.estado.aplicarRespuesta(err, 'Error al crear usuario'),
      });
  }

  // ---------- Eliminar ----------

  protected confirmarEliminar(u: Usuario): void {
    this.seleccionado.set(u);
    this.modalEliminarAbierto.set(true);
  }

  protected eliminar(): void {
    const u = this.seleccionado();
    if (!u) return;
    this.usuarioService.eliminar(u.id_u).subscribe({
      next: () => {
        this.modalEliminarAbierto.set(false);
        this.cargarDatos();
        this.notificaciones.exito('Usuario eliminado correctamente');
      },
      error: (err: unknown) => {
        this.modalEliminarAbierto.set(false);
        this.notificarErrorNegocio(err, 'Error al eliminar usuario');
      },
    });
  }

  private notificarErrorNegocio(err: unknown, porDefecto: string): void {
    const mensaje = mensajeErrorNegocio(err, porDefecto);
    if (mensaje) this.notificaciones.error(mensaje);
  }

  // ---------- Permisos ----------

  protected abrirPermisos(u: Usuario): void {
    this.seleccionado.set(u);
    this.usuarioService.permisos(u.id_u).subscribe({
      next: ({ submodulos_ids, dashboards_ids }) => {
        this.permisosSubmodulos.set(new Set(submodulos_ids));
        this.permisosDashboards.set(new Set(dashboards_ids));
        this.modalPermisosAbierto.set(true);
      },
      error: () => this.notificaciones.error('Error al cargar permisos'),
    });
  }

  protected toggleSubmodulo(id: number): void {
    this.permisosSubmodulos.update((s) => alternar(s, id));
  }

  protected togglePermiso(id: number): void {
    this.permisosDashboards.update((s) => alternar(s, id));
  }

  protected guardarPermisos(): void {
    const u = this.seleccionado();
    if (!u) return;
    this.usuarioService
      .guardarPermisos(u.id_u, {
        dashboards_ids: [...this.permisosDashboards()],
        submodulos_ids: [...this.permisosSubmodulos()],
      })
      .subscribe({
        next: () => {
          this.modalPermisosAbierto.set(false);
          this.notificaciones.exito('Permisos actualizados correctamente');
        },
        error: (err: unknown) => this.notificarErrorNegocio(err, 'Error al guardar permisos'),
      });
  }
}

function alternar(conjunto: ReadonlySet<number>, id: number): ReadonlySet<number> {
  const nuevo = new Set(conjunto);
  if (nuevo.has(id)) nuevo.delete(id);
  else nuevo.add(id);
  return nuevo;
}
