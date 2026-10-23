/**
 * Frases de apertura del vídeo.
 *
 * Regla: una frase lleva nombre de autor solo si su texto exacto está
 * comprobado en una fuente fiable (el libro, su web oficial). Las que no se
 * pudieron comprobar van sin autor, como idea. `source` dice de dónde sale.
 * A cada persona le salen en orden sin repetir hasta agotarlas.
 */
export interface Quote {
  id: string;
  author: string | null;
  en: string;
  es: string;
  source?: string;
}

export const QUOTES: Quote[] = [
  {
    id: "goddard-assumption",
    author: "Neville Goddard",
    en: "An assumption, though false, if persisted in will harden into fact.",
    es: "Una suposición, aunque sea falsa, si se sostiene, se endurece hasta volverse un hecho.",
  },
];

export function quoteById(id: string | undefined): Quote | undefined {
  return id ? QUOTES.find((q) => q.id === id) : undefined;
}

/**
 * La siguiente frase que esta persona no ha visto. El orden se baraja por
 * persona (con su id como semilla) para que no todo el mundo empiece igual.
 * Cuando ya las vio todas, vuelve a empezar.
 */
export function nextQuoteId(used: string[], seed: string): string {
  const order = shuffled(QUOTES.map((q) => q.id), seed);
  const seen = new Set(used);
  const fresh = order.find((id) => !seen.has(id));
  if (fresh) return fresh;
  // Todas vistas: la menos reciente.
  const lastSeen = new Map(used.map((id, i) => [id, i]));
  return order.reduce((a, b) => ((lastSeen.get(a) ?? -1) <= (lastSeen.get(b) ?? -1) ? a : b));
}

function shuffled<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
