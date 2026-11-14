import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

/** ¿La petición va a NUESTRA API? (el token nunca se envía a otros dominios) */
export const esPeticionApi = (url: string) => url.startsWith(environment.apiUrl);

/** Agrega "Authorization: Bearer <token>" solo a las peticiones dirigidas a la API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  if (!token || !esPeticionApi(req.url)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
