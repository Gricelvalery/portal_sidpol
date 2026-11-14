// La configuración se valida primero: si falta algo, el proceso termina aquí.
const env = require('./config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./config/db');
const { limiterApi } = require('./middlewares/rateLimit');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

app.use('/api', limiterApi);

// rutas
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/usuario',    require('./routes/usuario'));
app.use('/api/modulos',    require('./routes/modulos'));
app.use('/api/submodulos', require('./routes/submodulos'));
app.use('/api/dashboards', require('./routes/dashboards'));
app.use('/api/area',       require('./routes/area'));
app.use('/api/posicion',   require('./routes/posicion'));

// 404 en JSON y manejo centralizado de errores (deben ir al final)
app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Servidor en http://localhost:${env.PORT}`);
  db.verificarConexion();
});
