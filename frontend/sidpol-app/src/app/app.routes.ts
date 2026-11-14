import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { Layout } from './shared/layout/layout';

// Todas las pantallas se cargan bajo demanda (lazy loading).
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login)
  },

  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio)
      },
      {
        path: 'visor',
        loadComponent: () => import('./features/visor/visor').then((m) => m.Visor)
      },
      {
        path: 'visor/:id',
        loadComponent: () => import('./features/visor/visor').then((m) => m.Visor)
      },
      {
        // Solo existe para el admin (canMatch); el backend también lo exige.
        path: 'configuracion',
        canMatch: [adminGuard],
        loadChildren: () => import('./features/configuracion/configuracion.routes').then((m) => m.CONFIGURACION_ROUTES)
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];
