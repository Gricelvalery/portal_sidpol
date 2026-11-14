// Configuración de PRODUCCIÓN (ng build).
// apiUrl relativa: el frontend y la API se publican bajo el mismo dominio (proxy / servidor web).
export const environment = {
  production: true,
  apiUrl: '/api',
  // Dominios permitidos para el iframe del visor (también se valida en el backend).
  powerBiHosts: ['app.powerbi.com'] as readonly string[]
};
