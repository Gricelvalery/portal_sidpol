/** Filtra por texto (sin distinguir mayúsculas) en los campos que indique la pantalla. */
export function filtrarPorTexto<T>(
  lista: readonly T[],
  texto: string,
  campos: (fila: T) => readonly (string | null | undefined)[]
): T[] {
  const q = texto.toLowerCase();
  if (!q) return [...lista];
  return lista.filter((fila) => campos(fila).some((c) => (c ?? '').toLowerCase().includes(q)));
}
