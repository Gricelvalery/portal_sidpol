import { Routes } from '@angular/router';

// Las rutas coinciden con la columna submodulos.ruta de la base (configuracion/area, etc.).
export const CONFIGURACION_ROUTES: Routes = [
  { path: 'modulos', loadComponent: () => import('./modulos/modulos').then((m) => m.Modulos) },
  {
    path: 'submodulos',
    loadComponent: () => import('./submodulos/submodulos').then((m) => m.Submodulos),
  },
  { path: 'area', loadComponent: () => import('./areas/areas').then((m) => m.Areas) },
  { path: 'usuarios', loadComponent: () => import('./usuarios/usuarios').then((m) => m.Usuarios) },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboards/dashboards').then((m) => m.Dashboards),
  },
  { path: '', redirectTo: 'modulos', pathMatch: 'full' },
];
