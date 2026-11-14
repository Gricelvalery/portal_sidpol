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
  EstadoFormulario,
  MensajesValidacion,
  mensajeErrorNegocio,
} from '../../../shared/utils/estado-formulario';
import { textoObligatorio } from '../../../shared/validators/texto.validators';

interface GrupoDashboards {
  key: string;
  dashboards: Dashboard[];
}

// Misma regla que el backend: letras y espacios simples ("Juan Carlos", "De la Cruz")
const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+( [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;
const limpiarEspacios = (v: string) => (v || '').replace(/\s+/g, ' ').trim();

const MENSAJES: MensajesValidacion = {
  nombres_u: {
    required: 'Los nombres son requeridos',
    soloEspacios: 'Los nombres son requeridos',
    pattern: 'Los nombres solo deben contener letras',
  },
  apellido_paterno_u: {
    required: 'El apellido paterno es requerido',
    soloEspacios: 'El apellido paterno es requerido',
    pattern: 'El apellido paterno solo debe contener letras',
  },
  apellido_materno_u: { pattern: 'El apellido materno solo debe contener letras' },
  // La contraseña no se recorta: los espacios son parte de ella, pero no puede ser solo espacios
  contrasenia_u: {
    required: 'La contraseña es requerida',
    soloEspacios: 'La contraseña no puede contener solo espacios',
    minlength: 'La contraseña debe tener entre 6 y 72 caracteres',
    maxlength: 'La contraseña debe tener entre 6 y 72 caracteres',
  },
  id_posicion: { required: 'Selecciona una posición' },
};

@Component({
  selector: 'app-usuarios',
  imports: [ReactiveFormsModule, DataTable, CeldaTabla, Modal],
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
  protected readonly form = new FormGroup({
    nombres_u: new FormControl('', {
      nonNullable: true,
      validators: [...textoObligatorio, Validators.pattern(SOLO_LETRAS)],
    }),
    apellido_paterno_u: new FormControl('', {
      nonNullable: true,
      validators: [...textoObligatorio, Validators.pattern(SOLO_LETRAS)],
    }),
    apellido_materno_u: new FormControl('', {
      nonNullable: true,
      validators: Validators.pattern(SOLO_LETRAS),
    }),
    contrasenia_u: new FormControl('', {
      nonNullable: true,
      validators: [...textoObligatorio, Validators.minLength(6), Validators.maxLength(72)],
    }),
    rol_u: new FormControl<Rol>('user', { nonNullable: true }),
    id_posicion: new FormControl<number | null>(null, { validators: Validators.required }),
    autorizado: new FormControl(false, { nonNullable: true }),
  });

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
    this.form.reset();
    this.form.controls.contrasenia_u.enable();
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected abrirEditar(u: Usuario): void {
    this.modoEditar.set(true);
    this.seleccionado.set(u);
    this.form.reset({
      nombres_u: u.nombres_u,
      apellido_paterno_u: u.apellido_paterno_u,
      apellido_materno_u: u.apellido_materno_u || '',
      contrasenia_u: '',
      rol_u: u.rol_u,
      id_posicion: u.id_posicion,
      autorizado: u.autorizado || false,
    });
    // Al editar no se cambia la contraseña: el control deshabilitado no se valida
    this.form.controls.contrasenia_u.disable();
    this.estado.reiniciar();
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
    this.estado.reiniciar();
  }

  /** Normaliza espacios en nombres y apellidos (igual que el backend) antes de validar. */
  private normalizarNombres(): void {
    const c = this.form.controls;
    for (const control of [c.nombres_u, c.apellido_paterno_u, c.apellido_materno_u]) {
      control.setValue(limpiarEspacios(control.value));
    }
  }

  protected guardar(): void {
    this.normalizarNombres();
    if (!this.estado.validarFormulario(this.form, MENSAJES)) return;

    const {
      nombres_u,
      apellido_paterno_u,
      apellido_materno_u,
      contrasenia_u,
      rol_u,
      id_posicion,
      autorizado,
    } = this.form.getRawValue();
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
