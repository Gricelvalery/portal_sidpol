jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/dashboardRepository');

const request = require('supertest');
const app = require('../app');
const usuarioRepository = require('../repositories/usuarioRepository');
const dashboardRepository = require('../repositories/dashboardRepository');
const Dashboard = require('../models/Dashboard');
const { esUrlDashboardPermitida } = require('../utils/urlDashboard');
const { tokenDe, configurarSesiones } = require('./helpers');

const ADMIN = tokenDe(1, 'admin');
const crear = (link_d) =>
  request(app)
    .post('/api/dashboards')
    .set('Authorization', ADMIN)
    .send({ nombre_d: 'Tendencias', link_d, submodulos_id_sm: 6 });

beforeEach(() => {
  configurarSesiones(usuarioRepository, { 1: { rol: 'admin' } });
  dashboardRepository.insertar.mockImplementation(async (d) => new Dashboard({ id_d: 9, ...d }));
});

describe('F10: lista permitida para link_d', () => {
  test('acepta un link https de app.powerbi.com', async () => {
    const res = await crear('https://app.powerbi.com/view?r=eyJrIjoi');
    expect(res.status).toBe(201);
    expect(dashboardRepository.insertar).toHaveBeenCalled();
  });

  test.each([
    ['http sin TLS', 'http://app.powerbi.com/view?r=x'],
    ['otro dominio', 'https://evil.com/view?r=x'],
    ['subdominio engañoso', 'https://app.powerbi.com.evil.com/view'],
    ['credenciales en la URL', 'https://user:pass@app.powerbi.com/view'],
    ['puerto distinto', 'https://app.powerbi.com:8443/view'],
    ['javascript:', 'javascript:alert(1)'],
  ])('rechaza %s → 400 y no guarda', async (_caso, link) => {
    const res = await crear(link);
    expect(res.status).toBe(400);
    expect(res.body.errors.find((e) => e.path === 'link_d').msg).toMatch(/app\.powerbi\.com/);
    expect(dashboardRepository.insertar).not.toHaveBeenCalled();
  });

  test('misma regla que el frontend (función compartida en utils)', () => {
    expect(esUrlDashboardPermitida('https://APP.powerbi.com/view')).toBe(true);
    expect(esUrlDashboardPermitida('no es url')).toBe(false);
    expect(esUrlDashboardPermitida('https://otro.com', ['otro.com'])).toBe(true);
  });
});
