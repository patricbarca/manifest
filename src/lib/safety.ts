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

const BLOCKED_PATTERNS: { re: RegExp; reason: string }[] = [
  {
    re: /\b(curar|curarme|curación|cure|remisión|cáncer|tumor|diabetes|quimio)\b/i,
    reason:
      "No generamos visualizaciones sobre curación de enfermedades. Podemos trabajar el bienestar, la energía y los hábitos.",
  },
  {
    re: /\b(rentabilidad garantizada|ganar \d+ ?% |inversión segura|cripto garantizad)/i,
    reason: "No generamos promesas de rendimiento financiero garantizado.",
  },
  {
    re: /\b(niño|niña|menor de edad|mi hijo|mi hija|de \d ?años)\b/i,
    reason:
      "Solo se pueden crear visualizaciones de personas adultas, y solo de uno mismo.",
  },
  {
    re: /\b(desnud|sexual|erótic|porn)/i,
    reason: "No generamos contenido sexual ni desnudos.",
  },
];

export interface SafetyVerdict {
  ok: boolean;
  reason?: string;
}

export function checkIntention(text: string): SafetyVerdict {
  const trimmed = text.trim();
  if (trimmed.length < 8) {
    return { ok: false, reason: "Cuéntanos un poco más: al menos una frase completa." };
  }
  if (trimmed.length > 600) {
    return { ok: false, reason: "Demasiado largo. Resúmelo en unas pocas frases." };
  }
  for (const { re, reason } of BLOCKED_PATTERNS) {
    if (re.test(trimmed)) return { ok: false, reason };
  }
  return { ok: true };
}

/** El consentimiento del selfie es explicito y se guarda con el proyecto. */
export const SELFIE_CONSENT =
  "Confirmo que la foto es mía, que soy mayor de edad y que autorizo a usarla para generar mi vídeo.";
