/**
 * Límite de uso por persona en las rutas que gastan dinero (fal, modelos).
 * En memoria: basta con una sola instancia del servidor (Railway, 1 réplica).
 * Si algún día hay varias, hay que pasarlo a la base de datos o a Redis.
 */
const hits = new Map<string, number[]>();

/** true si aún puede; false si ya hizo `max` en la última ventana. */
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Limpieza de vez en cuando para que el mapa no crezca sin fin.
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < 24 * 3600_000)) hits.delete(k);
  return true;
}

const HOUR = 3600_000;
/** Límites por hora de cada ruta (generosos para un uso normal, cortos para un abuso). */
export const LIMITS = {
  upload: { max: 30, windowMs: HOUR },
  sceneIdeas: { max: 40, windowMs: HOUR },
  clarify: { max: 20, windowMs: HOUR },
  createManifestation: { max: 20, windowMs: HOUR },
  createProject: { max: 6, windowMs: HOUR },
} as const;

export function allowFor(route: keyof typeof LIMITS, userId: string): boolean {
  const l = LIMITS[route];
  return allow(`${route}:${userId}`, l.max, l.windowMs);
}
