// Garantiza que un id usado en una ruta de la API sea un entero positivo,
// para que no se pueda inyectar "../" u otros segmentos en la URL.
export function safeId(id: number): number {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Identificador inválido');
  }
  return id;
}
