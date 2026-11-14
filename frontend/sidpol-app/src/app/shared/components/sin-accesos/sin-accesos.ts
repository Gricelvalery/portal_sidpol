import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Aviso para el usuario que todavía no tiene permisos asignados (inicio y visor). */
@Component({
  selector: 'app-sin-accesos',
  template: `
    <div class="sin-accesos" role="status">
      <i class="fa-solid fa-lock"></i>
      <p>Aún no tienes accesos asignados. Contacta al administrador.</p>
    </div>
  `,
  styles: [`
    .sin-accesos {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 560px;
      margin: 24px auto;
      padding: 16px 20px;
      border-radius: 10px;
      background: #fff8e1;
      border: 1px solid #f3d27a;
      color: #6b4e00;
      font-size: 1rem;
    }
    .sin-accesos i { font-size: 1.4rem; }
    .sin-accesos p { margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SinAccesos {}
