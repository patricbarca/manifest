/**
 * Filtro de entrada.
 *
 * Un producto que coge la cara de una persona y la pone en escenas generadas
 * tiene riesgos que hay que cortar en la puerta: que alguien suba la cara de
 * otra persona; contenido sexual, con menores, de odio, violencia, autolesión
 * o drogas; y que el guion prometa cosas que no nos toca prometer (curaciones,
 * rendimientos financieros). Hay 4 capas: este filtro sobre lo que escribe la
 * persona, las reglas del guionista (llm.ts), este mismo filtro sobre el prompt
 * final (assertSafePrompt, en fal.ts) y el filtro de seguridad de fal.
 *
 * Esto es un filtro de primera linea a base de reglas. NO sustituye a una API
 * de moderacion ni a la verificacion de que el selfie es de quien lo sube;
 * ambas cosas estan en el roadmap antes de abrir el registro al publico.
 */

export type SafetyKey = "tooShort" | "tooLong" | "health" | "finance" | "minors" | "sexual" | "hate" | "violence" | "selfHarm" | "drugs";

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
  // Se bloquea que el protagonista sea un menor. Los hijos imaginados en una
  // escena familiar sí se permiten: se generan de cero (nunca se sube la foto
  // de un niño) y salen vestidos, en escenas cotidianas.
  {
    re: /\b(menor de edad|underage|soy (un )?(niño|niña)|i am a (child|kid)|tengo 1[0-7] años|i am 1[0-7])\b/i,
    key: "minors",
  },
  // Cualquier rastro sexual con menores entra aquí primero.
  { re: /\b(loli|lolita|shota|jailbait|preteen|pedo|pederast|paedo)/i, key: "minors" },
  {
    re: /\b(desnud|nude|naked|nudit|sexual|sexo\b|sex\b|sexy|sensual|erótic|erotic|porn|xxx|nsfw|lencer|lingerie|topless|ropa interior|underwear|stripper|striptease|escort|prostitu|onlyfans|fetich|fetish|bdsm|orgía|orgy|seductiv|provocativ|provocative)/i,
    key: "sexual",
  },
  {
    re: /\b(nazi|hitler|kkk|ku klux|swastika|esvástica|white power|supremac|raza superior|master race|limpieza étnica|ethnic cleansing|genocid|nigg|faggot|maric[oó]n|sudaca|spic\b|kike\b|chink\b|tranny|retard|subnormal|odio a los|odio a las|i hate (jews|muslims|gays|blacks|immigrants|women|men)|muerte a los|death to (the |all )?\w+)/i,
    key: "hate",
  },
  {
    re: /\b(matar a|mato a|asesin|murder|kill (him|her|them|my|people|someone|everyone)|disparar a|shoot (him|her|them|people|someone)|(fabricar|hacer|make|build) (a |una )?(bomb|bomba)|terroris|masacre|massacre|tortur|secuestr|kidnap|vengar|venganza|revenge|que (sufra|muera)|(make|watch|see) (him|her|them) (suffer|die)|(he|she|they) (dies|suffers)|armas?\b|guns?\b|rifles?\b|pistolas?\b|fusil)/i,
    key: "violence",
  },
  { re: /\b(suicid|matarme|kill myself|autolesi|self[- ]harm|cortarme|hacerme daño|hurt myself|quiero morir|want to die)/i, key: "selfHarm" },
  { re: /\b(cocaína|cocaine|heroína|heroin|metanfetamina|meth\b|fentanil|fentanyl|éxtasis|ecstasy|mdma)/i, key: "drugs" },
];

/**
 * Última barrera antes de pagar a fal: el prompt final de imagen o vídeo
 * (escrito por el guionista) pasa el mismo filtro que el texto del usuario.
 * Lanza un error en vez de generar si algo se coló.
 */
export function assertSafePrompt(prompt: string): void {
  const v = checkBlocked(prompt);
  if (!v.ok) throw new Error(`Contenido no permitido en el prompt (${v.key})`);
}

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
