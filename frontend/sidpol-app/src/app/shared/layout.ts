import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService } from '../services/auth';
import { ModulosService } from '../services/modulos';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  usuario: any = null;
  menuAbierto = false;
  menuUsuarioAbierto = false;
  perfilAbierto = false;
  modulosConSubs: any[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private svc: ModulosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.usuario = this.auth.getUsuario();
    this.cargarMenu();
  }

  // El backend ya devuelve solo los módulos/submódulos que el usuario puede ver
  // (admin: todo). Aquí solo se ordena y agrupa.
  cargarMenu() {
    forkJoin({
      modulos: this.svc.getModulos(),
      submodulos: this.svc.getSubmodulos()
    }).subscribe({
      next: ({ modulos, submodulos }) => {
        const porNombre = (campo: string) => (a: any, b: any) => a[campo].localeCompare(b[campo]);
        const subsOrdenados = [...submodulos].sort(porNombre('nombre_sm'));

        this.modulosConSubs = [...modulos]
          .sort(porNombre('nombre_m'))
          .map((m: any) => ({
            ...m,
            abierto: false,
            submodulos: subsOrdenados.filter((s: any) => s.modulos_id_m === m.id_m)
          }))
          .filter((m: any) => m.submodulos.length > 0 || this.auth.esAdmin());

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar el menú:', err)
    });
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
    this.menuUsuarioAbierto = false;
  }

  toggleModulo(id: number) {
    const m = this.modulosConSubs.find(x => x.id_m === id);
    if (m) m.abierto = !m.abierto;
  }

  toggleMenuUsuario() {
    this.menuUsuarioAbierto = !this.menuUsuarioAbierto;
    this.menuAbierto = false;
  }

  cerrarMenuUsuario() {
    this.menuUsuarioAbierto = false;
  }

  verPerfil() {
    this.menuUsuarioAbierto = false;
    this.perfilAbierto = true;
  }

  cerrarPerfil() {
    this.perfilAbierto = false;
  }

  pantallaCompleta() {
    this.menuUsuarioAbierto = false;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  cerrarSesion() {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }

  normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
  }

  irA(s: any) {
  this.menuAbierto = false;

  if (s.ruta) {
    this.router.navigate(['/' + s.ruta]);
    return;
  }

  const mapaConfiguracion: { [key: string]: string } = {
    'Módulos': '/configuracion/modulos',
    'Submódulos': '/configuracion/submodulos',
    'Dependencias': '/configuracion/area',
    'Usuarios': '/configuracion/usuarios',
    'Dashboard': '/configuracion/dashboard'
  };

  const destino = mapaConfiguracion[s.nombre_sm];
  // Submódulo sin ruta propia → visor con sus dashboards
  this.router.navigate([destino || `/visor/${s.id_sm}`]);
  }
}