const AppError = require('./AppError');
const DOMINIO_CORREO = 'sidpol.pe';

// minúsculas, sin tildes, ñ→n (NFD separa la virgulilla), solo letras y espacios
function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Genera candidatos en orden de preferencia:
 *   juan.perez → juan.perezc → juan.perezc2 → juan.perezc3 ...
 *   (sin apellido materno: juan.perez → juan.perez2 → juan.perez3 ...)
 */
function* candidatosUsername(nombres, apellidoPaterno, apellidoMaterno) {
  const primerNombre = normalizar(nombres).split(' ')[0];
  const paterno = normalizar(apellidoPaterno).replace(/ /g, '');
  if (!primerNombre || !paterno) {
    throw new AppError(400, 'Nombre y apellido paterno son necesarios para generar el usuario');
  }

  const base = `${primerNombre}.${paterno}`;
  yield base;

  const inicialMaterno = normalizar(apellidoMaterno).charAt(0);
  const conInicial = inicialMaterno ? base + inicialMaterno : base;
  if (inicialMaterno) yield conInicial;

  for (let n = 2; ; n++) yield `${conInicial}${n}`;
}

const correoDe = (username) => `${username}@${DOMINIO_CORREO}`;

module.exports = { normalizar, candidatosUsername, correoDe };
