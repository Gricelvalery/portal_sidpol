// Configuración de DESARROLLO (ng serve / ng build --configuration development).
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  powerBiHosts: ['app.powerbi.com'] as readonly string[]
};
