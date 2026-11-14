import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DashboardService } from '../../core/api/dashboard.service';
import { SubmoduloService } from '../../core/api/submodulo.service';
import { Dashboard, PaginaDashboard } from '../../core/models';
import { construirUrlDashboard } from '../../core/seguridad/dashboard-url';
import { SinAccesos } from '../../shared/components/sin-accesos/sin-accesos';

/** Muestra los dashboards de Power BI de un submódulo (o todos los permitidos) en un iframe. */
@Component({
  selector: 'app-visor',
  imports: [SinAccesos],
  templateUrl: './visor.html',
  styleUrl: './visor.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Visor implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly submoduloService = inject(SubmoduloService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly dashboards = signal<Dashboard[]>([]);
  protected readonly seleccionado = signal<Dashboard | null>(null);
  protected readonly paginaActiva = signal<PaginaDashboard | null>(null);
  protected readonly embedUrl = signal<SafeResourceUrl | null>(null);
  protected readonly urlNoPermitida = signal(false);
  protected readonly cargando = signal(true);
  protected readonly sinAcceso = signal(false);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        this.cargar(id ? Number(id) : null);
      });
  }

  /** El backend filtra por permisos; con id de submódulo valida el acceso (403 si no lo tiene). */
  private cargar(idSubmodulo: number | null): void {
    this.cargando.set(true);
    this.sinAcceso.set(false);
    this.dashboards.set([]);
    this.seleccionado.set(null);
    this.embedUrl.set(null);

    const peticion = idSubmodulo ? this.submoduloService.dashboards(idSubmodulo) : this.dashboardService.listar();
    peticion.subscribe({
      next: (lista) => {
        this.dashboards.set(lista);
        if (lista.length > 0) this.seleccionarDashboard(lista[0]);
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.sinAcceso.set(err instanceof HttpErrorResponse && err.status === 403);
        this.cargando.set(false);
      }
    });
  }

  protected seleccionarDashboard(d: Dashboard): void {
    this.seleccionado.set(d);
    const paginas = d.paginas ?? [];
    if (paginas.length > 0) {
      this.seleccionarPagina(paginas[0]);
    } else {
      this.paginaActiva.set(null);
      this.mostrar(d.link_d, null);
    }
  }

  protected seleccionarPagina(pagina: PaginaDashboard): void {
    const d = this.seleccionado();
    if (!d) return;
    this.paginaActiva.set(pagina);
    this.mostrar(d.link_d, pagina.seccion);
  }

  protected onCambiarDashboard(evento: Event): void {
    const id = Number((evento.target as HTMLSelectElement).value);
    const d = this.dashboards().find((x) => x.id_d === id);
    if (d) this.seleccionarDashboard(d);
  }

  /** Solo se confía en la URL si pasa la lista permitida (https + app.powerbi.com). */
  private mostrar(link: string, seccion: string | null | undefined): void {
    const url = construirUrlDashboard(link, seccion);
    this.urlNoPermitida.set(url === null);
    this.embedUrl.set(url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null);
  }
}
