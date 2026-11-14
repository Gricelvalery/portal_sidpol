// La especificación OpenAPI debe coincidir con las rutas reales y su rol declarado
// (x-rol-requerido) debe ser el que la API aplica de verdad.
jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/permisoRepository');
jest.mock('../repositories/areaRepository');
jest.mock('../repositories/posicionRepository');
jest.mock('../repositories/moduloRepository');
jest.mock('../repositories/submoduloRepository');
jest.mock('../repositories/dashboardRepository');

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const app = require('../app');
const { especificacion } = require('../docs/openapi');
const usuarioRepository = require('../repositories/usuarioRepository');
const permisoRepository = require('../repositories/permisoRepository');
const repos = [
  require('../repositories/areaRepository'),
  require('../repositories/posicionRepository'),
  require('../repositories/moduloRepository'),
  require('../repositories/submoduloRepository'),
  require('../repositories/dashboardRepository'),
];
const { tokenDe, configurarSesiones } = require('./helpers');

const METODOS = ['get', 'post', 'put', 'delete'];
const ROLES = [
  'público',
  'autenticado',
  'admin',
  'autenticado + permiso del submódulo',
  'autenticado + permiso del dashboard',
];

/** Rutas reales: lee los app.use('/api/...', require('./routes/...')) y recorre cada router. */
function rutasReales() {
  const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const montajes = [
    ...appJs.matchAll(/app\.use\('(\/api\/[\w-]+)',\s*require\('\.\/routes\/([\w-]+)'\)\)/g),
  ];
  const rutas = [];
  for (const [, prefijo, modulo] of montajes) {
    const router = require(`../routes/${modulo}`);
    for (const capa of router.stack) {
      if (!capa.route) continue;
      const sufijo = capa.route.path === '/' ? '' : capa.route.path;
      for (const metodo of Object.keys(capa.route.methods)) {
        rutas.push(`${metodo.toUpperCase()} ${(prefijo + sufijo).replace(/:(\w+)/g, '{$1}')}`);
      }
    }
  }
  return rutas.sort();
}

/** Operaciones documentadas: [{ clave, ruta, metodo, op }] */
const operaciones = Object.entries(especificacion.paths).flatMap(([ruta, item]) =>
  METODOS.filter((m) => item[m]).map((m) => ({
    clave: `${m.toUpperCase()} ${ruta}`,
    ruta,
    metodo: m,
    op: item[m],
  })),
);

describe('cobertura de la especificación', () => {
  test('cada ruta de Express está documentada, y no hay rutas documentadas que no existan', () => {
    expect(operaciones.map((o) => o.clave).sort()).toEqual(rutasReales());
  });

  test.each(operaciones.map((o) => [o.clave, o]))(
    '%s: rol, seguridad y códigos de respuesta',
    (_c, o) => {
      const rol = o.op['x-rol-requerido'];
      const codigos = Object.keys(o.op.responses);
      expect(ROLES).toContain(rol);
      expect(o.op.summary).toBeTruthy();
      expect(codigos).toEqual(expect.arrayContaining(['500']));
      expect(codigos.some((c) => /^2\d\d$/.test(c))).toBe(true);

      if (rol === 'público') {
        expect(o.op.security).toEqual([]);
      } else {
        expect(o.op.security).toBeUndefined(); // hereda bearerAuth global
        expect(codigos).toEqual(expect.arrayContaining(['401', '429']));
      }
      if (rol === 'admin' || rol.includes('permiso')) expect(codigos).toContain('403');
      if (o.op.requestBody || o.ruta.includes('{id}')) expect(codigos).toContain('400');
    },
  );
});

describe('el rol documentado es el que aplica la API', () => {
  const USER = tokenDe(2, 'user');

  beforeEach(() => {
    configurarSesiones(usuarioRepository, { 2: { rol: 'user' } });
    permisoRepository.accesos.mockResolvedValue({ submodulos: [], dashboards: [] });
    permisoRepository.tieneAcceso.mockResolvedValue(false);
    for (const repo of repos) repo.listar.mockResolvedValue([]);
  });

  const llamar = (o, token) => {
    const ruta = o.ruta.replace('{id}', '1');
    const r = request(app)[o.metodo](ruta).send({});
    return token ? r.set('Authorization', token) : r;
  };

  test.each(operaciones.map((o) => [o.clave, o.op['x-rol-requerido'], o]))(
    '%s (%s)',
    async (_c, rol, o) => {
      const sinToken = await llamar(o);
      const conUser = await llamar(o, USER);

      if (rol === 'público') {
        expect(sinToken.status).not.toBe(401);
        return;
      }
      expect(sinToken.status).toBe(401);
      if (rol === 'admin' || rol.includes('permiso')) {
        expect(conUser.status).toBe(403);
      } else {
        expect([401, 403]).not.toContain(conUser.status); // autenticado: un user puede entrar
      }
    },
  );
});

describe('publicación en /api/docs', () => {
  test('Swagger UI y el JSON de la especificación', async () => {
    const ui = await request(app).get('/api/docs/');
    expect(ui.status).toBe(200);
    expect(ui.text).toContain('swagger-ui');

    const json = await request(app).get('/api/docs/openapi.json');
    expect(json.body).toEqual(especificacion);
  });

  test('con DOCS_ENABLED=false no se publica (404)', async () => {
    const anterior = process.env.DOCS_ENABLED;
    process.env.DOCS_ENABLED = 'false';
    let appSinDocs;
    jest.isolateModules(() => {
      appSinDocs = require('../app');
    });
    process.env.DOCS_ENABLED = anterior;
    expect((await request(appSinDocs).get('/api/docs/')).status).toBe(404);
  });
});
