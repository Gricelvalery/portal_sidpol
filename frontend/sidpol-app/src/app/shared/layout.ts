import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
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

  cargarMenu() {
    this.svc.getModulos().subscribe({
      next: (modulos) => {
        this.svc.getSubmodulos().subscribe({
          next: (submodulos) => {
            const esAdmin = this.auth.esAdmin();
            const permisos = this.auth.getPermisos();

            const subsFiltrados = esAdmin
              ? submodulos
              : submodulos.filter((s: any) =>
                  permisos.some(p => p.submodulos_id_sm === s.id_sm || p.ruta === s.ruta)
                );

            const modulosFiltrados = modulos.filter((m: any) => { 
            if ( 
            !esAdmin && 
            m.nombre_m.toLowerCase() === 'configuración' 
            ) { 
            return false; 
            } 
            if (esAdmin) { 
            return true; 
            }
            return subsFiltrados.some( 
            (s: any) => s.modulos_id_m === m.id_m 
            ); 
            });

            const modulosOrdenados = modulosFiltrados.sort((a: any, b: any) =>
              a.nombre_m.localeCompare(b.nombre_m)
            );

            const submodulosOrdenados = subsFiltrados.sort((a: any, b: any) =>
              a.nombre_sm.localeCompare(b.nombre_sm)
            );

            this.modulosConSubs = modulosOrdenados.map((m: any) => ({
              ...m,
              abierto: false,
              submodulos: submodulosOrdenados.filter((s: any) => s.modulos_id_m === m.id_m)
            }));

            this.cdr.detectChanges();
          },
          error: (err) => console.error('Error submodulos:', err)
        });
      },
      error: (err) => console.error('Error modulos:', err)
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

  irA(ruta: string) {
    this.menuAbierto = false;
    this.router.navigate([ruta]);
  }
}