import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ModuloService } from '../../core/api/modulo.service';
import { SubmoduloService } from '../../core/api/submodulo.service';
import { Modulo, Submodulo } from '../../core/models';

export interface ModuloMenu extends Modulo {
  submodulos: Submodulo[];
}

/** Estructura común de las pantallas internas: barra superior, menú lateral y perfil. */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, UpperCasePipe],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly moduloService = inject(ModuloService);
  private readonly submoduloService = inject(SubmoduloService);

  protected readonly usuario = this.auth.usuario;
  protected readonly menuAbierto = signal(false);
  protected readonly menuUsuarioAbierto = signal(false);
  protected readonly perfilAbierto = signal(false);
  protected readonly modulos = signal<ModuloMenu[]>([]);
  private readonly abiertos = signal<ReadonlySet<number>>(new Set());

  ngOnInit(): void {
    this.cargarMenu();
  }

  /** El backend ya devuelve solo lo que el usuario puede ver (admin: todo). Aquí se ordena y agrupa. */
  private cargarMenu(): void {
    forkJoin({
      modulos: this.moduloService.listar(),
      submodulos: this.submoduloService.listar(),
    }).subscribe(({ modulos, submodulos }) => {
      const subs = [...submodulos].sort((a, b) => a.nombre_sm.localeCompare(b.nombre_sm));
      this.modulos.set(
        [...modulos]
          .sort((a, b) => a.nombre_m.localeCompare(b.nombre_m))
          .map((m) => ({ ...m, submodulos: subs.filter((s) => s.modulos_id_m === m.id_m) }))
          .filter((m) => m.submodulos.length > 0 || this.auth.esAdmin()),
      );
    });
  }

  protected estaAbierto(idModulo: number): boolean {
    return this.abiertos().has(idModulo);
  }

  protected toggleModulo(idModulo: number): void {
    this.abiertos.update((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(idModulo)) nuevo.delete(idModulo);
      else nuevo.add(idModulo);
      return nuevo;
    });
  }

  protected toggleMenu(): void {
    this.menuAbierto.update((v) => !v);
    this.menuUsuarioAbierto.set(false);
  }

  protected toggleMenuUsuario(): void {
    this.menuUsuarioAbierto.update((v) => !v);
    this.menuAbierto.set(false);
  }

  protected cerrarMenuUsuario(): void {
    this.menuUsuarioAbierto.set(false);
  }

  protected verPerfil(): void {
    this.menuUsuarioAbierto.set(false);
    this.perfilAbierto.set(true);
  }

  protected cerrarPerfil(): void {
    this.perfilAbierto.set(false);
  }

  protected pantallaCompleta(): void {
    this.menuUsuarioAbierto.set(false);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
  }

  /** La ruta viene de la base (submodulos.ruta); sin ruta propia → visor con sus dashboards. */
  protected irA(s: Submodulo): void {
    this.menuAbierto.set(false);
    this.router.navigate(['/' + (s.ruta ?? `visor/${s.id_sm}`)]);
  }
}
