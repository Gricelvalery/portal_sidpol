// Carga y valida la configuración UNA sola vez. Si algo falta o es inválido,
// el proceso termina antes de aceptar peticiones. Nunca imprime valores.
const path = require('path');
// En pruebas (NODE_ENV=test) NUNCA se lee el .env real: las variables vienen de tests/setup.js.
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
}

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
  const crudo = texto(nombre, {
    porDefecto: porDefecto === undefined ? undefined : String(porDefecto),
  });
  const n = Number(crudo);
  if (crudo !== undefined && (!Number.isInteger(n) || n < min || n > max)) {
    errores.push(`${nombre} debe ser un entero entre ${min} y ${max}`);
  }
  return n;
}

function booleano(nombre, porDefecto) {
  const crudo = (process.env[nombre] ?? '').trim().toLowerCase();
  if (!crudo) return porDefecto;
  if (crudo === 'true') return true;
  if (crudo === 'false') return false;
  errores.push(`${nombre} debe ser true o false`);
  return porDefecto;
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
  .map((o) => o.trim())
  .filter(Boolean);
for (const origen of CORS_ORIGIN) {
  let valido = false;
  try {
    valido = new URL(origen).origin === origen;
  } catch {
    /* inválido */
  }
  if (!valido)
    errores.push(
      'CORS_ORIGIN contiene un origen inválido (formato: http://host:puerto, sin "/" final)',
    );
}

// Dominios permitidos para los links de dashboards (iframe del visor)
const POWERBI_HOSTS = texto('POWERBI_HOSTS', { porDefecto: 'app.powerbi.com' })
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);
if (POWERBI_HOSTS.length === 0 || POWERBI_HOSTS.some((h) => !/^[a-z0-9.-]+$/.test(h))) {
  errores.push('POWERBI_HOSTS debe ser una lista de dominios separados por coma');
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
  POWERBI_HOSTS,
  TRUST_PROXY,
  LOG_LEVEL: texto('LOG_LEVEL', {
    porDefecto: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  }),
  // Swagger en /api/docs: activo por defecto, salvo en producción (DOCS_ENABLED=true lo fuerza)
  DOCS_ENABLED: booleano('DOCS_ENABLED', process.env.NODE_ENV !== 'production'),
  RATE_LIMIT_API: entero('RATE_LIMIT_API', { porDefecto: 500 }),
  RATE_LIMIT_LOGIN: entero('RATE_LIMIT_LOGIN', { porDefecto: 5, max: 100 }),
  BCRYPT_COST: entero('BCRYPT_COST', { porDefecto: 12, min: 4, max: 15 }),
};

const NIVELES_LOG = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
if (!NIVELES_LOG.includes(env.LOG_LEVEL)) {
  errores.push('LOG_LEVEL debe ser uno de: ' + NIVELES_LOG.join(', '));
}

if (env.NODE_ENV === 'production' && env.BCRYPT_COST < 12) {
  errores.push('BCRYPT_COST debe ser al menos 12 en producción');
}

if (errores.length > 0) {
  // El logger depende de esta configuración, así que aquí se escribe directo a stderr
  process.stderr.write('Configuración inválida en backend/.env (ver backend/.env.example):\n');
  for (const e of errores) process.stderr.write('  - ' + e + '\n');
  process.exit(1);
}

module.exports = Object.freeze(env);
