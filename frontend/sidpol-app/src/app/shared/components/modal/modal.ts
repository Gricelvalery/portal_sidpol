import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type VarianteModal = 'normal' | 'small' | 'permisos';

/**
 * Ventana modal: fondo oscuro + caja con título, contenido y pie de acciones.
 * Uso (la pantalla decide si se muestra con @if):
 *   <app-modal titulo="Editar" (cerrar)="...">
 *     ...campos...
 *     <ng-container acciones> <button>...</button> </ng-container>
 *   </app-modal>
 */
@Component({
  selector: 'app-modal',
  template: `
    <div class="modal-overlay" (click)="alClickFuera()"></div>
    <div class="modal"
         role="dialog"
         aria-modal="true"
         [attr.aria-label]="titulo()"
         [class.modal-small]="variante() === 'small'"
         [class.modal-permisos]="variante() === 'permisos'">
      <h3 class="modal-titulo">{{ titulo() }}</h3>
      <ng-content />
      <div class="modal-acciones">
        <ng-content select="[acciones]" />
      </div>
    </div>
  `,
  styleUrls: ['../../styles/crud.css'],
  styles: [':host { display: contents; }'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Modal {
  readonly titulo = input('');
  readonly variante = input<VarianteModal>('normal');
  /** Si es false, hacer click en el fondo no cierra (confirmaciones, permisos). */
  readonly cerrarAlClickFuera = input(true);
  readonly cerrar = output<void>();

  protected alClickFuera(): void {
    if (this.cerrarAlClickFuera()) this.cerrar.emit();
  }
}
