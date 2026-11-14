import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/**
 * Rechaza textos formados solo por espacios, tabs o saltos de línea.
 * Validators.required NO los rechaza (para él '   ' no está vacío), por eso se usan juntos.
 * Un valor vacío ('') lo deja pasar: de eso se encarga Validators.required.
 */
export const noSoloEspacios: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const valor: unknown = control.value;
  return typeof valor === 'string' && valor.length > 0 && valor.trim().length === 0
    ? { soloEspacios: true }
    : null;
};

/** Campo de texto obligatorio: no vacío y no solo espacios. */
export const textoObligatorio: ValidatorFn[] = [Validators.required, noSoloEspacios];
