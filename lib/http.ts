/** Lee el mensaje `error` que devuelven nuestras rutas de API, o usa `fallback`. */
export async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    return typeof body?.error === 'string' ? body.error : fallback
  } catch {
    return fallback
  }
}

export const NETWORK_ERROR = 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
