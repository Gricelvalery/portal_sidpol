import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModulosService } from '../../services/modulos';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SinAccesos } from '../../shared/sin-accesos';

@Component({
  selector: 'app-visor',
  standalone: true,
  imports: [CommonModule, FormsModule, SinAccesos],
  templateUrl: './visor.html',
  styleUrl: './visor.css'
})
export class Visor implements OnInit {
  dashboards: any[] = [];
  dashboardSeleccionado: any = null;
  paginaActiva: any = null;
  embedUrl: SafeResourceUrl | null = null;
  cargando = true;
  sinAcceso = false;
  submoduloId: number | null = null;

  constructor(
    private svc: ModulosService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.submoduloId = params['id'] ? +params['id'] : null;
      this.cargarDashboards();
    });
  }

  // El backend filtra por permisos; con id de submódulo valida acceso (403 si no tiene).
  cargarDashboards() {
    this.cargando = true;
    this.sinAcceso = false;
    this.dashboards = [];
    this.dashboardSeleccionado = null;
    this.embedUrl = null;

    const peticion = this.submoduloId
      ? this.svc.getDashboardsDeSubmodulo(this.submoduloId)
      : this.svc.getDashboards();

    peticion.subscribe({
      next: (data) => {
        this.dashboards = data;
        if (this.dashboards.length > 0) {
          this.seleccionarDashboard(this.dashboards[0]);
        }
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.sinAcceso = err.status === 403;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarDashboard(d: any) {
    this.dashboardSeleccionado = d;
    const paginas = d.paginas || [];
    if (paginas.length > 0) {
      this.seleccionarPagina(paginas[0]);
    } else {
      this.paginaActiva = null;
      this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(d.link_d);
    }
    this.cdr.detectChanges();
  }

  seleccionarPagina(pagina: any) {
    this.paginaActiva = pagina;
    const baseUrl = this.dashboardSeleccionado.link_d;
    const url = pagina.seccion ? `${baseUrl}&pageName=${pagina.seccion}` : baseUrl;
    this.embedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.cdr.detectChanges();
  }

  onCambiarDashboard(event: any) {
    const id = +event.target.value;
    const d = this.dashboards.find(x => x.id_d === id);
    if (d) this.seleccionarDashboard(d);
  }
}