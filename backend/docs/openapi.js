// Carga la especificación OpenAPI (docs/openapi.yaml) y la publica en /api/docs.
const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

const especificacion = YAML.parse(fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8'));

/**
 * Router de documentación: Swagger UI en /api/docs y el JSON en /api/docs/openapi.json.
 * La CSP de helmet se relaja SOLO aquí (Swagger UI usa estilos e imágenes inline).
 */
function crearRouterDocs() {
  const router = express.Router();
  router.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    }),
  );
  router.get('/openapi.json', (_req, res) => res.json(especificacion));
  router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(especificacion, { customSiteTitle: 'API SIDPOL' }),
  );
  return router;
}

module.exports = { especificacion, crearRouterDocs };
