import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../services/auth';
import { ModulosService } from '../../services/modulos';
import { SinAccesos } from '../../shared/sin-accesos';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [SinAccesos],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  sinAccesos = signal(false);

  constructor(private auth: AuthService, private svc: ModulosService) {}

  ngOnInit() {
    if (this.auth.esAdmin()) return;
    // El backend devuelve solo los submódulos accesibles; vacío = sin accesos.
    this.svc.getSubmodulos().subscribe({
      next: (subs) => this.sinAccesos.set(subs.length === 0)
    });
  }
}
