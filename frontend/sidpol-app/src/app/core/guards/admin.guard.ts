import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/**
 * Las rutas de configuración solo "existen" para el admin (canMatch): a cualquier
 * otro usuario lo devuelve a /inicio. El backend igual rechaza con 403 (checkRole).
 */
export const adminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.esAdmin() ? true : router.createUrlTree(['/inicio']);
};
