import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

const MS_OCULTAR_ERROR = 10000;

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Campos del formulario (ngModel)
  username = '';
  contrasenia = '';

  protected readonly errorMsg = signal('');
  protected readonly errorUsername = signal('');
  protected readonly errorContrasenia = signal('');
  protected readonly loading = signal(false);
  protected readonly mostrarPass = signal(false);

  private temporizador: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
  }

  ngOnInit(): void {
    if (this.auth.estaLogueado()) {
      this.router.navigate(['/inicio']);
    }
  }

  protected togglePass(): void {
    this.mostrarPass.update((v) => !v);
  }

  protected alEscribirUsuario(): void {
    this.errorUsername.set('');
    this.errorMsg.set('');
  }

  protected alEscribirContrasenia(): void {
    this.errorContrasenia.set('');
    this.errorMsg.set('');
  }

  private validar(): boolean {
    this.errorMsg.set('');
    this.errorUsername.set(this.username.trim() ? '' : 'El usuario es obligatorio');
    this.errorContrasenia.set(this.contrasenia.trim() ? '' : 'La contraseña es obligatoria');
    return !this.errorUsername() && !this.errorContrasenia();
  }

  protected iniciarSesion(): void {
    if (!this.validar()) return;

    this.loading.set(true);
    this.errorMsg.set('');

    // El AuthService guarda token y usuario; los errores se muestran aquí (petición silenciosa).
    this.auth.login(this.username, this.contrasenia).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/inicio']);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.mostrarError(err instanceof HttpErrorResponse ? err.status : 0);
      }
    });
  }

  private mostrarError(status: number): void {
    const mensajes: Record<number, string> = {
      403: 'Usuario no autorizado. Contacte al administrador.',
      401: 'Usuario o contraseña incorrectos.',
      429: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
    };
    this.errorMsg.set(mensajes[status] ?? 'Error de conexión. Intente nuevamente.');

    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.errorMsg.set(''), MS_OCULTAR_ERROR);
  }
}
