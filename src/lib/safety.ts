/**
 * Filtro de entrada.
 *
 * Un producto que coge la cara de una persona y la pone en escenas generadas
 * tiene dos riesgos que hay que cortar en la puerta: que alguien suba la cara
 * de otra persona, y que el guion prometa cosas que no nos toca prometer
 * (curaciones, rendimientos financieros).
 *
 * Esto es un filtro de primera linea a base de reglas. NO sustituye a una API
 * de moderacion ni a la verificacion de que el selfie es de quien lo sube;
 * ambas cosas estan en el roadmap antes de abrir el registro al publico.
 */

type SafetyKey = "tooShort" | "tooLong" | "health" | "finance" | "minors" | "sexual";

/**
 * Los patrones son por idioma: bloquear "curar" no sirve de nada si el
 * usuario escribe "cure my". Cada entrada devuelve una CLAVE, no un mensaje,
 * para que el texto salga del diccionario en el idioma del usuario.
 */
const BLOCKED_PATTERNS: { re: RegExp; key: SafetyKey }[] = [
  {
    re: /\b(curar|curarme|curación|cure|healing|remisión|remission|cáncer|cancer|tumor|diabetes|quimio|chemo)\b/i,
    key: "health",
  },
  {
    re: /\b(rentabilidad garantizada|guaranteed returns?|ganar \d+ ?% |make \d+ ?% |inversión segura|safe investment|cripto garantizad|guaranteed crypto)/i,
    key: "finance",
  },
  {
    re: /\b(niño|niña|menor de edad|mi hijo|mi hija|my son|my daughter|my kid|child|underage|de \d ?años|\d+ years old)\b/i,
    key: "minors",
  },
  { re: /\b(desnud|nude|naked|sexual|erótic|erotic|porn)/i, key: "sexual" },
];

export interface SafetyVerdict {
  ok: boolean;
  /** Clave del diccionario (`t.safety[key]`) con el motivo del bloqueo. */
  key?: SafetyKey;
}

export function checkIntention(text: string): SafetyVerdict {
  const trimmed = text.trim();
  if (trimmed.length < 8) return { ok: false, key: "tooShort" };
  if (trimmed.length > 600) return { ok: false, key: "tooLong" };
  for (const { re, key } of BLOCKED_PATTERNS) {
    if (re.test(trimmed)) return { ok: false, key };
  }
  return { ok: true };
}
