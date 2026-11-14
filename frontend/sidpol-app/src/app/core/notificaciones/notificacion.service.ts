import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error';

export interface Notificacion {
  id: number;
  mensaje: string;
  tipo: TipoNotificacion;
}

const DURACION_MS = 3000;

/** Cola global de toasts. La muestra <app-toast> (una sola vez, en el componente raíz). */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly _lista = signal<Notificacion[]>([]);
  readonly lista = this._lista.asReadonly();

  private siguienteId = 1;
  private readonly temporizadores = new Map<number, ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.temporizadores.forEach(clearTimeout);
      this.temporizadores.clear();
    });
  }

  exito(mensaje: string): void {
    this.mostrar(mensaje, 'exito');
  }

  error(mensaje: string): void {
    this.mostrar(mensaje, 'error');
  }

  cerrar(id: number): void {
    clearTimeout(this.temporizadores.get(id));
    this.temporizadores.delete(id);
    this._lista.update((l) => l.filter((n) => n.id !== id));
  }

  private mostrar(mensaje: string, tipo: TipoNotificacion): void {
    // Evita apilar el mismo aviso varias veces (p. ej. varios 401 al vencer la sesión)
    if (this._lista().some((n) => n.mensaje === mensaje && n.tipo === tipo)) return;

    const id = this.siguienteId++;
    this._lista.update((l) => [...l, { id, mensaje, tipo }]);
    this.temporizadores.set(
      id,
      setTimeout(() => this.cerrar(id), DURACION_MS),
    );
  }
}
