import { FormControl } from '@angular/forms';
import { noSoloEspacios, textoObligatorio } from './texto.validators';

describe('validadores de texto', () => {
  const errores = (valor: unknown, validadores = textoObligatorio) =>
    new FormControl(valor, { validators: validadores }).errors;

  it.each([['   '], ['\t'], ['\n \t '], ['        ']])('noSoloEspacios rechaza %j', (valor) => {
    expect(noSoloEspacios(new FormControl(valor))).toEqual({ soloEspacios: true });
  });

  it.each([[''], ['Juan'], ['  Juan  '], [null], [42]])('noSoloEspacios acepta %j', (valor) => {
    expect(noSoloEspacios(new FormControl(valor))).toBeNull();
  });

  it('Validators.required solo NO rechaza espacios; textoObligatorio sí', () => {
    expect(new FormControl('   ', { validators: textoObligatorio[0] }).errors).toBeNull();
    expect(errores('   ')).toEqual({ soloEspacios: true });
  });

  it('textoObligatorio: vacío → required; texto real → válido', () => {
    expect(errores('')).toEqual({ required: true });
    expect(errores('DIRTIC')).toBeNull();
  });
});
