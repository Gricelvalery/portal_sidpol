import { environment } from '../../../environments/environment';

const SECCION_VALIDA = /^[A-Za-z0-9_-]{1,100}$/;

/**
 * Lista permitida para el iframe del visor: solo https y hosts de Power BI
 * (environment.powerBiHosts). El backend aplica la misma regla al guardar el link.
 */
export function esUrlDashboardPermitida(
  valor: string,
  hosts: readonly string[] = environment.powerBiHosts,
): boolean {
  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return false;
  }
  return (
    url.protocol === 'https:' &&
    url.port === '' &&
    !url.username &&
    !url.password &&
    hosts.includes(url.hostname.toLowerCase())
  );
}

/**
 * URL final del iframe, o null si no está permitida.
 * La página ("seccion") se agrega como parámetro con URLSearchParams, no concatenando texto.
 */
export function construirUrlDashboard(link: string, seccion?: string | null): string | null {
  if (!esUrlDashboardPermitida(link)) return null;
  if (!seccion) return link;
  if (!SECCION_VALIDA.test(seccion)) return null;
  const url = new URL(link);
  url.searchParams.set('pageName', seccion);
  return url.toString();
}
