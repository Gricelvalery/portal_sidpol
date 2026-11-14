const env = require('../config/env');

/**
 * Lista permitida para los links de dashboards (se muestran en un iframe):
 * solo https, sin puerto ni credenciales, y host dentro de POWERBI_HOSTS.
 * Es la misma regla que aplica el frontend (core/seguridad/dashboard-url.ts).
 */
function esUrlDashboardPermitida(valor, hosts = env.POWERBI_HOSTS) {
  let url;
  try {
    url = new URL(String(valor));
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    url.port === '' &&
    !url.username &&
    !url.password &&
    hosts.includes(url.hostname.toLowerCase())
  );
}

module.exports = { esUrlDashboardPermitida };
