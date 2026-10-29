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

type SafetyKey = "tooShort" | "tooLong" | "crisis" | "health" | "finance" | "minors" | "sexual";

/**
 * Los patrones son por idioma: bloquear "curar" no sirve de nada si el
 * usuario escribe "cure my". Cada entrada devuelve una CLAVE, no un mensaje,
 * para que el texto salga del diccionario en el idioma del usuario.
 */
const BLOCKED_PATTERNS: { re: RegExp; key: SafetyKey }[] = [
  // Va primero: si alguien habla de hacerse daño no se genera nada y se le
  // muestran recursos de ayuda (t.safety.crisis). Mejor un falso positivo que
  // un guion de "ya está hecho" para quien está en crisis.
  {
    re: /(suicid|autolesi|quitarme la vida|acabar con mi vida|matarme|hacerme daño|dejar de existir|no quiero (vivir|seguir viviendo|estar vivo|estar viva)|quiero morir|quiero morirme|mejor muert[oa]|no merece la pena vivir|no vale la pena vivir|kill myself|end my life|take my (own )?life|self[- ]?harm|hurt myself|want to die|wanna die|don'?t want to (live|be alive|exist)|better off dead|stop existing)/i,
    key: "crisis",
  },
  {
    re: /\b(curar|curarme|curación|cure|healing|remisión|remission|cáncer|cancer|tumor|diabetes|quimio|chemo)\b/i,
    key: "health",
  },
  {
    re: /\b(rentabilidad garantizada|guaranteed returns?|ganar \d+ ?% |make \d+ ?% |inversión segura|safe investment|cripto garantizad|guaranteed crypto)/i,
    key: "finance",
  },
  // Se bloquea que el protagonista sea un menor. Los hijos imaginados en una
  // escena familiar sí se permiten: se generan de cero (nunca se sube la foto
  // de un niño) y salen vestidos, en escenas cotidianas.
  {
    re: /\b(menor de edad|underage|soy (un )?(niño|niña)|i am a (child|kid)|tengo 1[0-7] años|i am 1[0-7])\b/i,
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
  return checkBlocked(trimmed);
}

/**
 * Los deseos se filtran uno a uno. Cada casilla puede ser corta ("mi casa"),
 * pero entre todas tienen que decir algo.
 */
export function checkDesires(desires: string[]): SafetyVerdict {
  const total = desires.join(" ").trim();
  if (total.length < 8) return { ok: false, key: "tooShort" };
  for (const desire of desires) {
    const verdict = checkBlocked(desire);
    if (!verdict.ok) return verdict;
  }
  return { ok: true };
}

/**
 * Las respuestas a las preguntas de aclaración entran en el guion igual que
 * la intención, así que pasan el mismo filtro. Sin mínimo de longitud: "rojo"
 * es una respuesta válida.
 */
export function checkDetails(answers: { answer: string }[]): SafetyVerdict {
  for (const { answer } of answers) {
    const verdict = checkBlocked(answer);
    if (!verdict.ok) return verdict;
  }
  return { ok: true };
}

export function checkBlocked(text: string): SafetyVerdict {
  for (const { re, key } of BLOCKED_PATTERNS) {
    if (re.test(text)) return { ok: false, key };
  }
  return { ok: true };
}
