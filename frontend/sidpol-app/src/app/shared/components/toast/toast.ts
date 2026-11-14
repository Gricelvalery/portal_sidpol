import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificacionService } from '../../../core/notificaciones/notificacion.service';

/** Muestra los toasts de NotificacionService. Se coloca una sola vez en el componente raíz. */
@Component({
  selector: 'app-toast',
  template: `
    <div class="toasts" aria-live="polite">
      @for (n of notificaciones.lista(); track n.id) {
        <div class="notificacion" role="status" [class.notificacion-error]="n.tipo === 'error'">
          <i
            class="fa-solid"
            [class.fa-circle-check]="n.tipo === 'exito'"
            [class.fa-circle-xmark]="n.tipo === 'error'"
          >
          </i>
          {{ n.mensaje }}
        </div>
      }
    </div>
  `,
  styleUrl: './toast.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toast {
  protected readonly notificaciones = inject(NotificacionService);
}
