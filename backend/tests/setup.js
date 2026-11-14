// Variables de entorno para las pruebas. Con NODE_ENV=test, config/env.js NO lee
// el .env real, así que las pruebas nunca tocan credenciales ni la BD de Supabase.
// DB apunta a 127.0.0.1:1: si algún código llegara a consultar la BD (no debería,
// los repositorios están simulados), fallaría de inmediato en vez de conectarse.
Object.assign(process.env, {
  NODE_ENV: 'test',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  DB_NAME: 'test',
  JWT_SECRET: 'secreto-de-pruebas-sidpol-0123456789-abcdefghij',
  JWT_EXPIRES_IN: '2h',
  CORS_ORIGIN: 'http://localhost:4200',
  TRUST_PROXY: 'false',
  RATE_LIMIT_API: '1000',
  RATE_LIMIT_LOGIN: '5',
  BCRYPT_COST: '4'
});
