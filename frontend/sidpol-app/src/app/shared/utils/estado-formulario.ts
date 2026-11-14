import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ErrorApi } from '../../core/models';

export type ErroresCampos = Record<string, string>;

/**
 * Mensaje de un error "de negocio" del backend (400, 404 o 409), p. ej.
 * "No puedes eliminar tu propio usuario". Los 401/403/429/5xx ya los
 * notifica el errorInterceptor, así que aquí devuelven null.
 */
export function mensajeErrorNegocio(err: unknown, porDefecto: string): string | null {
  if (!(err instanceof HttpErrorResponse) || ![400, 404, 409].includes(err.status)) return null;
  return (err.error as ErrorApi | null)?.error || porDefecto;
}

/**
 * Estado de errores de un formulario (antes copiado en cada pantalla):
 * errores por campo + un mensaje general. Entiende el formato 400 del backend
 * ({ errors: [{ path, msg }] }) y el de error simple ({ error: '...' }).
 */
export class EstadoFormulario {
  readonly errores = signal<ErroresCampos>({});
  readonly general = signal('');

  reiniciar(): void {
    this.errores.set({});
    this.general.set('');
  }

  /** Errores de la validación local. Devuelve true si el formulario es válido. */
  validar(errores: ErroresCampos): boolean {
    this.errores.set(errores);
    this.general.set('');
    return Object.keys(errores).length === 0;
  }

  limpiar(campo: string): void {
    const actuales = this.errores();
    if (!actuales[campo]) return;
    const { [campo]: _omitido, ...resto } = actuales;
    this.errores.set(resto);
    this.general.set('');
  }

  aplicarRespuesta(err: unknown, mensajePorDefecto: string): void {
    const cuerpo = err instanceof HttpErrorResponse ? (err.error as ErrorApi | null) : null;
    if (Array.isArray(cuerpo?.errors)) {
      const porCampo: ErroresCampos = {};
      for (const e of cuerpo.errors) {
        if (e.path && !porCampo[e.path]) porCampo[e.path] = e.msg;
      }
      this.errores.set(porCampo);
      this.general.set('');
      return;
    }
    this.general.set(cuerpo?.error || mensajePorDefecto);
  }
}
