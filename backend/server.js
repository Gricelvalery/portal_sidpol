const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend')));

// rutas
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/usuario',    require('./routes/usuario'));
app.use('/api/modulos',    require('./routes/modulos'));
app.use('/api/submodulos', require('./routes/submodulos'));
app.use('/api/dashboards', require('./routes/dashboards'));
app.use('/api/area',       require('./routes/area'));
app.use('/api/posicion',   require('./routes/posicion'));

// manejo centralizado de errores (debe ir al final)
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});