const { normalizar, candidatosUsername, correoDe } = require('../utils/username');
const AppError = require('../utils/AppError');

const primeros = (n, ...args) => {
  const g = candidatosUsername(...args);
  return Array.from({ length: n }, () => g.next().value);
};

describe('utils/username', () => {

  test('primer nombre + "." + apellido paterno, en minúsculas', () => {
    expect(primeros(1, 'Juan Carlos', 'Pérez', 'Cáceres')).toEqual(['juan.perez']);
  });

  test('si existe: + inicial del apellido materno, luego números', () => {
    expect(primeros(4, 'Juan', 'Pérez', 'Cáceres'))
      .toEqual(['juan.perez', 'juan.perezc', 'juan.perezc2', 'juan.perezc3']);
  });

  test('sin apellido materno: directo a los números', () => {
    expect(primeros(3, 'Juan', 'Pérez', '')).toEqual(['juan.perez', 'juan.perez2', 'juan.perez3']);
    expect(primeros(2, 'Juan', 'Pérez', null)).toEqual(['juan.perez', 'juan.perez2']);
  });

  test('quita tildes, ñ → n y une apellidos compuestos', () => {
    expect(primeros(1, 'Ñuño', 'Muñoz', '')).toEqual(['nuno.munoz']);
    expect(primeros(2, 'José María', 'De la Cruz', 'Ávila')).toEqual(['jose.delacruz', 'jose.delacruza']);
    expect(primeros(1, 'ÁNGEL', 'GÜEMES', '')).toEqual(['angel.guemes']);
  });

  test('normalizar limpia espacios y caracteres no alfabéticos', () => {
    expect(normalizar('  María   José-2 ')).toBe('maria jose');
  });

  test('sin nombre o sin apellido paterno lanza AppError 400', () => {
    expect(() => primeros(1, '', 'Pérez', '')).toThrow(AppError);
    expect(() => primeros(1, 'Juan', '   ', '')).toThrow('Nombre y apellido paterno son necesarios');
  });

  test('correo = username@sidpol.pe', () => {
    expect(correoDe('juan.perezc2')).toBe('juan.perezc2@sidpol.pe');
  });

});
