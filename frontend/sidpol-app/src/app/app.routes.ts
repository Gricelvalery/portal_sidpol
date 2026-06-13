import { Routes } from '@angular/router';
import { Layout } from './shared/layout';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.Login)
  },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: 'inicio',
        loadComponent: () =>
          import('./pages/inicio/inicio').then(m => m.Inicio)
      },

      {
        path: 'visor',
        loadComponent: () =>
          import('./pages/visor/visor').then(m => m.Visor)
      },
      {
        path: 'visor/:id',
        loadComponent: () =>
          import('./pages/visor/visor').then(m => m.Visor)
      },

      {
        path: 'configuracion',
        children: [
          {
            path: 'modulos',
            loadComponent: () =>
              import('./pages/configuracion/modulos').then(m => m.Modulos)
          },
          {
            path: 'submodulos',
            loadComponent: () =>
              import('./pages/configuracion/submodulos').then(m => m.Submodulos)
          },
          {
            path: 'area',
            loadComponent: () =>
              import('./pages/configuracion/area').then(m => m.Area)
          },
          {
            path: 'usuarios',
            loadComponent: () =>
              import('./pages/configuracion/usuarios').then(m => m.Usuarios)
          },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./pages/configuracion/dashboard').then(m => m.Dashboard)
          },
          {
            path: '',
            redirectTo: 'modulos',
            pathMatch: 'full'
          }
        ]
      },

      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
