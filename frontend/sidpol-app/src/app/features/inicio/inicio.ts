import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { SubmoduloService } from '../../core/api/submodulo.service';
import { SinAccesos } from '../../shared/components/sin-accesos/sin-accesos';

@Component({
  selector: 'app-inicio',
  imports: [SinAccesos],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Inicio implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly submoduloService = inject(SubmoduloService);

  protected readonly sinAccesos = signal(false);

  ngOnInit(): void {
    if (this.auth.esAdmin()) return;
    // El backend devuelve solo los submódulos accesibles; vacío = sin accesos.
    this.submoduloService.listar().subscribe((subs) => this.sinAccesos.set(subs.length === 0));
  }
}
