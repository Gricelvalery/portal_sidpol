import { construirUrlDashboard, esUrlDashboardPermitida } from './dashboard-url';

describe('lista permitida del iframe (dashboard-url)', () => {
  const OK = 'https://app.powerbi.com/view?r=eyJrIjoiYWJjIn0%3D';

  it('acepta solo https://app.powerbi.com', () => {
    expect(esUrlDashboardPermitida(OK)).toBe(true);
    expect(esUrlDashboardPermitida('https://APP.powerbi.com/view?r=x')).toBe(true);
  });

  it.each([
    ['http (sin TLS)', 'http://app.powerbi.com/view?r=x'],
    ['otro dominio', 'https://evil.com/view?r=x'],
    ['subdominio engañoso', 'https://app.powerbi.com.evil.com/view'],
    ['credenciales en la URL', 'https://user:pass@app.powerbi.com/view'],
    ['puerto distinto', 'https://app.powerbi.com:8443/view'],
    ['javascript:', 'javascript:alert(1)'],
    ['texto que no es URL', 'no es una url']
  ])('rechaza %s', (_caso, url) => {
    expect(esUrlDashboardPermitida(url)).toBe(false);
  });

  it('sin sección devuelve el link tal cual', () => {
    expect(construirUrlDashboard(OK)).toBe(OK);
  });

  it('agrega pageName con URLSearchParams (no concatena texto)', () => {
    const url = new URL(construirUrlDashboard(OK, 'ReportSection1')!);
    expect(url.searchParams.get('pageName')).toBe('ReportSection1');
    expect(url.searchParams.get('r')).toBe('eyJrIjoiYWJjIn0=');
  });

  it('rechaza secciones con caracteres peligrosos y links no permitidos', () => {
    expect(construirUrlDashboard(OK, 'abc&evil=1')).toBeNull();
    expect(construirUrlDashboard('https://evil.com/x', 'ok')).toBeNull();
  });
});
