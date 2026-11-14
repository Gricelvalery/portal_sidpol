import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChildren,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export interface ColumnaTabla<T> {
  titulo: string;
  /** Texto de la celda. */
  valor?: (fila: T) => string | number | null | undefined;
  /** Si el valor está vacío, muestra este texto (p. ej. '—'). */
  siVacio?: string;
  /** Nombre de una plantilla <ng-template appCelda="..."> para celdas especiales. */
  celda?: string;
  claseCelda?: string;
}

/**
 * Plantilla de celda personalizada:
 * <ng-template appCelda="acciones" [appCeldaDe]="filas" let-fila> ... </ng-template>
 * [appCeldaDe] solo sirve para que el compilador conozca el tipo de "fila".
 */
@Directive({ selector: 'ng-template[appCelda]' })
export class CeldaTabla<T> {
  /** Nombre de la columna que usa esta plantilla. */
  readonly appCelda = input.required<string>();
  /** Solo para el tipado de la fila; no se usa en tiempo de ejecución. */
  readonly appCeldaDe = input<readonly T[]>([]);
  readonly plantilla = inject<TemplateRef<{ $implicit: T }>>(TemplateRef);

  static ngTemplateContextGuard<T>(_dir: CeldaTabla<T>, _ctx: unknown): _ctx is { $implicit: T } {
    return true;
  }
}

/**
 * Tabla de las pantallas de configuración: buscador, botón "Agregar", estado
 * "Cargando...", filas y "Sin resultados". El filtrado lo hace la pantalla.
 */
@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet],
  templateUrl: './data-table.html',
  styleUrls: ['../../styles/crud.css', './data-table.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTable<T> {
  readonly columnas = input.required<readonly ColumnaTabla<T>[]>();
  readonly filas = input.required<readonly T[]>();
  readonly cargando = input(false);
  readonly textoAgregar = input('');
  readonly busqueda = model('');
  readonly agregar = output<void>();

  private readonly celdas = contentChildren(CeldaTabla);
  protected readonly plantillas = computed(() => {
    const mapa = new Map<string, TemplateRef<{ $implicit: T }>>();
    for (const c of this.celdas())
      mapa.set(c.appCelda(), c.plantilla as TemplateRef<{ $implicit: T }>);
    return mapa;
  });

  protected texto(fila: T, columna: ColumnaTabla<T>): string | number | null | undefined {
    const valor = columna.valor?.(fila);
    return columna.siVacio !== undefined ? valor || columna.siVacio : valor;
  }

  protected alBuscar(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
}
