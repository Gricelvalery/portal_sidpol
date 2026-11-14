import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ErrorApi } from '../models';
import { NotificacionService } from '../notificaciones/notificacion.service';
import { SILENCIAR_ERRORES } from './contexto';
import { esPeticionApi } from './auth.interceptor';

export const MENSAJES_ERROR = {
  sesion: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  permisos: 'No tienes permisos para esta acción.',
  limite: 'Demasiadas peticiones. Intenta de nuevo en unos minutos.',
  conexion: 'No se pudo conectar con el servidor.',
  interno: 'Ocurrió un error interno. Intenta de nuevo.'
} as const;

const esLogin = (url: string) => url.endsWith('/auth/login');

/**
 * Manejo global de errores HTTP de la API:
 *  401 → cierra la sesión y vuelve al login (siempre, salvo en el propio login).
 *  403 / 429 / sin conexión / 5xx → toast, salvo que la petición use SILENCIAR_ERRORES.
 * 400 y 404 los maneja cada formulario.
 * El error siempre se relanza para que el componente también pueda reaccionar.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const notificaciones = inject(NotificacionService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || !esPeticionApi(req.url)) {
        return throwError(() => err);
      }

      if (err.status === 401 && !esLogin(req.url)) {
        auth.cerrarSesion();
        notificaciones.error(MENSAJES_ERROR.sesion);
        return throwError(() => err);
      }
      if (req.context.get(SILENCIAR_ERRORES)) {
        return throwError(() => err);
      }

      const cuerpo = err.error as ErrorApi | null;
      if (err.status === 403) {
        notificaciones.error(MENSAJES_ERROR.permisos);
      } else if (err.status === 429) {
        notificaciones.error(cuerpo?.error ?? MENSAJES_ERROR.limite);
      } else if (err.status === 0) {
        notificaciones.error(MENSAJES_ERROR.conexion);
      } else if (err.status >= 500) {
        notificaciones.error(MENSAJES_ERROR.interno);
      }
      return throwError(() => err);
    })
  );
};
