// Arma la aplicación Express SIN abrir un puerto (server.js la levanta; las pruebas
// la usan directamente con supertest). La configuración se valida al importarse env.
const env = require('./config/env');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { limiterApi } = require('./middlewares/rateLimit');
const { notFound, errorHandler } = require('./middlewares/errores');
const { crearRegistroHttp } = require('./middlewares/registroHttp');
const { logger } = require('./config/logger');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.TRUST_PROXY);

app.use(crearRegistroHttp(logger));
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

app.use('/api', limiterApi);

// rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuario', require('./routes/usuario'));
app.use('/api/modulos', require('./routes/modulos'));
app.use('/api/submodulos', require('./routes/submodulos'));
app.use('/api/dashboards', require('./routes/dashboards'));
app.use('/api/area', require('./routes/area'));
app.use('/api/posicion', require('./routes/posicion'));

// 404 en JSON y manejo centralizado de errores (deben ir al final)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
