import { HttpContext, HttpContextToken } from '@angular/common/http';

/**
 * Si una petición lleva este token en true, el errorInterceptor NO muestra toasts:
 * la pantalla maneja el error por su cuenta (login, aviso "sin accesos" del visor).
 */
export const SILENCIAR_ERRORES = new HttpContextToken<boolean>(() => false);

export const contextoSilencioso = () => new HttpContext().set(SILENCIAR_ERRORES, true);
