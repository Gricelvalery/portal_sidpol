// Punto de entrada: valida la configuración, arma la app y abre el puerto.
const env = require('./config/env');
const app = require('./app');
const db = require('./config/db');

app.listen(env.PORT, () => {
  console.log(`Servidor en http://localhost:${env.PORT}`);
  db.verificarConexion();
});
