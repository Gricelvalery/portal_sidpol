import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

// Oculta las rutas de configuración a quien no es admin.
// El backend igual rechaza con 403 (checkRole('admin')).
export const adminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.esAdmin() ? true : router.createUrlTree(['/inicio']);
};
