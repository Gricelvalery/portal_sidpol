
import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {

  username = '';
  contrasenia = '';

  errorMsg = '';
  errorUsername = '';
  errorContrasenia = '';

  loading = false;
  mostrarPass = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (this.auth.estaLogueado()) {
      this.router.navigate(['/inicio']);
    }
  }

  togglePass() {
    this.mostrarPass = !this.mostrarPass;
  }

  limpiarErrores() {
    this.errorMsg = '';
    this.errorUsername = '';
    this.errorContrasenia = '';
  }

  validar(): boolean {

    let valido = true;

    this.limpiarErrores();

    if (!this.username.trim()) {
      this.errorUsername = 'El usuario es obligatorio';
      valido = false;
    }

    if (!this.contrasenia.trim()) {
      this.errorContrasenia = 'La contraseña es obligatoria';
      valido = false;
    }

    this.cdr.detectChanges();

    return valido;
  }

  iniciarSesion() {

    if (!this.validar()) return;

    this.loading = true;
    this.errorMsg = '';

    this.cdr.detectChanges();

    this.auth.login(this.username, this.contrasenia).subscribe({

      next: (data: any) => {

        this.loading = false;

        this.auth.guardarToken(data.token);
        this.auth.guardarUsuario(data.usuario);
        this.auth.guardarPermisos(data.permisos || []);

        this.cdr.detectChanges();

        this.router.navigate(['/inicio']);
      },

      error: (err: any) => {

        console.log(err);

        this.loading = false;

        if (err.status === 403) {

          this.errorMsg =
            'Usuario no autorizado. Contacte al administrador.';

        }
        else if (err.status === 401) {

          this.errorMsg =
            'Usuario o contraseña incorrectos.';

        }
        else {

          this.errorMsg =
            'Error de conexión. Intente nuevamente.';
        }

        this.cdr.detectChanges();

        setTimeout(() => {

          this.errorMsg = '';

          this.cdr.detectChanges();

        }, 10000);
      }
    });
  }
}

