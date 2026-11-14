// Carga y valida la configuración UNA sola vez. Si algo falta o es inválido,
// el proceso termina antes de aceptar peticiones. Nunca imprime valores.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const errores = [];

function texto(nombre, { obligatoria = true, porDefecto } = {}) {
  const valor = (process.env[nombre] ?? '').trim();
  if (!valor) {
    if (obligatoria && porDefecto === undefined) errores.push(`${nombre} es obligatoria`);
    return porDefecto;
  }
  return valor;
}

function entero(nombre, { porDefecto, min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const crudo = texto(nombre, { porDefecto: porDefecto === undefined ? undefined : String(porDefecto) });
  const n = Number(crudo);
  if (crudo !== undefined && (!Number.isInteger(n) || n < min || n > max)) {
    errores.push(`${nombre} debe ser un entero entre ${min} y ${max}`);
  }
  return n;
}

const JWT_SECRET = texto('JWT_SECRET') || '';
if (JWT_SECRET && JWT_SECRET.length < 32) {
  errores.push('JWT_SECRET debe tener al menos 32 caracteres');
}

const JWT_EXPIRES_IN = texto('JWT_EXPIRES_IN', { porDefecto: '2h' });
if (!/^\d+[smhd]$/.test(JWT_EXPIRES_IN)) {
  errores.push('JWT_EXPIRES_IN debe tener el formato <número><s|m|h|d>, por ejemplo 2h');
}

const CORS_ORIGIN = (texto('CORS_ORIGIN') || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
for (const origen of CORS_ORIGIN) {
  let valido = false;
  try { valido = new URL(origen).origin === origen; } catch { /* inválido */ }
  if (!valido) errores.push('CORS_ORIGIN contiene un origen inválido (formato: http://host:puerto, sin "/" final)');
}

// TRUST_PROXY: false (local), true, o número de proxies delante (p. ej. 1 en Render/Nginx)
const trustCrudo = texto('TRUST_PROXY', { porDefecto: 'false' }).toLowerCase();
let TRUST_PROXY;
if (trustCrudo === 'true') TRUST_PROXY = true;
else if (trustCrudo === 'false') TRUST_PROXY = false;
else if (/^\d+$/.test(trustCrudo)) TRUST_PROXY = Number(trustCrudo);
else errores.push('TRUST_PROXY debe ser true, false o un número');

const env = {
  NODE_ENV: texto('NODE_ENV', { porDefecto: 'development' }),
  PORT: entero('PORT', { porDefecto: 3000, max: 65535 }),
  DB_HOST: texto('DB_HOST'),
  DB_PORT: entero('DB_PORT', { max: 65535 }),
  DB_USER: texto('DB_USER'),
  DB_PASSWORD: texto('DB_PASSWORD'),
  DB_NAME: texto('DB_NAME'),
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CORS_ORIGIN,
  TRUST_PROXY,
  RATE_LIMIT_API: entero('RATE_LIMIT_API', { porDefecto: 500 })
};

if (errores.length > 0) {
  console.error('Configuración inválida en backend/.env (ver backend/.env.example):');
  for (const e of errores) console.error('  - ' + e);
  process.exit(1);
}

module.exports = Object.freeze(env);
