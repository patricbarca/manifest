import type {
  Affirmation,
  LifeArea,
  Scene,
  ScriptDraft,
  Tier,
  VisualStyle,
} from "./types";
import { VISUAL_STYLES } from "./types";
import { sceneCount } from "./pricing";
import type { Locale } from "./i18n/locale";

/**
 * Banco base por área. Sirve para dos cosas:
 *  - red de seguridad cuando no hay LLM configurado (modo demo, o fallo)
 *  - few-shot que se le pasa al LLM para fijar el tono
 *
 * Reglas del guion: primera persona, presente, afirmativo (sin "no"), corto
 * para que entre en un respiro, y concreto antes que grandilocuente. Se
 * escribe desde el final, como si ya hubiera ocurrido (Neville Goddard,
 * Joe Dispenza): nada de "atraigo", "quiero" ni "está en camino".
 *
 * Las ESCENAS no se traducen: van a un modelo de imagen, que responde mejor
 * en inglés. Las AFIRMACIONES sí, porque el usuario las dice en voz alta y en
 * su idioma.
 */
const SCENES: Record<LifeArea, string[]> = {
  carrera: [
    "confident professional walking into a bright modern office lobby at sunrise",
    "presenting to an attentive boardroom, warm light through floor-to-ceiling windows",
    "signing a contract at a clean desk, calm and focused",
    "being congratulated by colleagues, genuine smiles, candid moment",
    "working late with quiet focus, city skyline glowing behind",
    "stepping onto a stage to speak, audience silhouettes, spotlight",
    "opening the door of a private office with their name on it",
    "celebrating a launch with a small team, confetti, natural joy",
  ],
  abundancia: [
    "standing at a window of a serene apartment overlooking the city at dawn",
    "reviewing a growing chart on a tablet, relaxed posture, morning coffee",
    "handing keys of a new home, warm afternoon light",
    "dining with family at a long table full of food, laughter",
    "walking through a calm high-end space, unhurried and at ease",
    "placing a bag in the trunk of a car before a trip, easy smile",
    "donating at a community event, warm connection",
    "reading on a terrace with the sea in the distance, golden hour",
  ],
  salud: [
    "running along a coastal path at sunrise, strong stride",
    "stretching in a sunlit room, calm morning routine",
    "preparing a colorful fresh meal in a bright kitchen",
    "swimming in clear open water, powerful and free",
    "lifting weights in a clean gym, focused expression",
    "hiking a green ridge with wide open sky",
    "sleeping peacefully in a quiet bedroom, soft dawn light",
    "laughing outdoors with friends after exercise, healthy glow",
  ],
  amor: [
    "walking hand in hand along a quiet street at dusk",
    "sharing a slow breakfast by a sunlit window, easy intimacy",
    "dancing in a living room, unposed and happy",
    "being embraced on a beach at golden hour",
    "laughing at a dinner table with close friends, candlelight",
    "watching the sunset from a balcony together, calm",
    "a warm reunion at an airport arrivals hall",
    "sitting close on a sofa reading, comfortable silence",
  ],
  confianza: [
    "standing tall in front of a mirror, calm direct gaze",
    "speaking into a microphone on a small stage, self-assured",
    "walking through a crowded street with steady posture",
    "raising a hand to speak in a full room",
    "portrait against a plain wall, soft light, quiet strength",
    "entering a room as heads turn, unbothered and composed",
    "writing in a journal by a window, deliberate",
    "stepping outside at dawn, deep breath, wide sky",
  ],
  libertad: [
    "working on a laptop on a terrace overlooking the ocean",
    "boarding a plane with a single small bag, calm excitement",
    "driving an empty coastal road at golden hour, window down",
    "waking up in a sunlit room in an unfamiliar city",
    "walking through a foreign market, curious and relaxed",
    "sitting on a cliff edge looking at a wide valley",
    "a slow coffee at a corner cafe, no rush",
    "watching the stars from a quiet campsite",
  ],
};

const AFFIRMATIONS: Record<Locale, Record<LifeArea, string[]>> = {
  es: {
    carrera: [
      "Merezco el trabajo que estoy construyendo.",
      "Hablo con claridad y me escuchan.",
      "Tomo decisiones difíciles con calma.",
      "Mi trabajo abre puertas que aún no veo.",
      "Cada día soy mejor en lo que hago.",
      "Lidero desde la confianza, no desde el miedo.",
      "El reconocimiento llega porque lo he ganado.",
      "Digo que sí a lo que me hace crecer.",
    ],
    abundancia: [
      "El dinero llega a mí de formas que puedo sostener.",
      "Administro lo que tengo con serenidad.",
      "Soy generoso porque tengo de sobra.",
      "Mi valor se traduce en ingresos.",
      "Recibo sin culpa lo que he trabajado.",
      "Tomo decisiones de dinero desde la abundancia.",
      "Mi cuenta crece mes a mes.",
      "Vivo tranquilo con lo que gano.",
    ],
    salud: [
      "Mi cuerpo es fuerte y responde.",
      "Elijo lo que me da energía.",
      "Respiro hondo y mi cuerpo se calma.",
      "Descanso porque me cuido.",
      "Cada día me muevo con más soltura.",
      "Trato a mi cuerpo con respeto.",
      "Tengo energía para lo que me importa.",
      "Mi salud es la base de todo lo demás.",
    ],
    amor: [
      "Doy y recibo amor con las manos abiertas.",
      "Soy suficiente tal y como soy.",
      "Digo lo que siento sin miedo.",
      "Estoy con alguien que me trata bien.",
      "Elijo relaciones que me suman.",
      "Pongo límites y sigo siendo querido.",
      "Confío en lo que se está formando.",
      "Merezco un amor tranquilo.",
    ],
    confianza: [
      "Ocupo mi espacio sin pedir permiso.",
      "Mi voz merece ser escuchada.",
      "Me sostengo aunque me tiemble la voz.",
      "Soy capaz de aprender lo que haga falta.",
      "Dejo de compararme y sigo mi paso.",
      "Me miro y me gusto.",
      "Actúo aunque tenga miedo.",
      "Confío en mi criterio.",
    ],
    libertad: [
      "Diseño mis días a mi manera.",
      "Mi tiempo me pertenece.",
      "Trabajo desde donde quiero estar.",
      "Elijo la vida que quiero vivir.",
      "Confío en el camino que estoy abriendo.",
      "Me muevo ligero.",
      "Lo simple me basta y me sobra.",
      "Soy libre y responsable a la vez.",
    ],
  },
  en: {
    carrera: [
      "I deserve the work I'm building.",
      "I speak clearly and people listen.",
      "I make hard calls calmly.",
      "My work opens doors I can't see yet.",
      "Every day I get better at this.",
      "I lead from confidence, not fear.",
      "Recognition comes because I earned it.",
      "I say yes to what makes me grow.",
    ],
    abundancia: [
      "Money reaches me in ways I can hold.",
      "I manage what I have calmly.",
      "I'm generous because I have plenty.",
      "My value turns into income.",
      "I receive what I've earned without guilt.",
      "I make money decisions from abundance.",
      "My savings grow month by month.",
      "I live at ease with what I earn.",
    ],
    salud: [
      "My body is strong and responds.",
      "I choose what gives me energy.",
      "I breathe deep and my body settles.",
      "I rest because I take care of myself.",
      "Every day I move more easily.",
      "I treat my body with respect.",
      "I have energy for what matters.",
      "My health holds everything else up.",
    ],
    amor: [
      "I give and receive love openly.",
      "I am enough exactly as I am.",
      "I say what I feel without fear.",
      "I am with someone who treats me well.",
      "I choose relationships that add to me.",
      "I set limits and I'm still loved.",
      "I trust what's taking shape.",
      "I deserve a calm love.",
    ],
    confianza: [
      "I take up my space without asking.",
      "My voice deserves to be heard.",
      "I hold steady even when my voice shakes.",
      "I can learn whatever it takes.",
      "I stop comparing and keep my pace.",
      "I look at myself and I like it.",
      "I act even when I'm afraid.",
      "I trust my judgment.",
    ],
    libertad: [
      "I design my days my way.",
      "My time belongs to me.",
      "I work from where I want to be.",
      "I choose the life I want to live.",
      "I trust the path I'm opening.",
      "I travel light.",
      "Simple is more than enough.",
      "I am free and responsible at once.",
    ],
  },
};

const OPENING: Record<
  Locale,
  { hook: string; gratitude: string[]; request: string; closing: string; fallbackTitle: string }
> = {
  es: {
    hook: "Respira. Siéntelo como algo que ya ha ocurrido.",
    gratitude: [
      "Gracias por mi salud y por este momento.",
      "Gracias por la gente que me quiere.",
      "Gracias por todo lo que ya he construido.",
    ],
    request: "Gracias, universo, porque esto ya es mío.",
    closing: "Gracias. Ya está hecho.",
    fallbackTitle: "Mi visualización",
  },
  en: {
    hook: "Breathe. Feel it as something that has already happened.",
    gratitude: [
      "Thank you for my health and for this moment.",
      "Thank you for the people who love me.",
      "Thank you for everything I have already built.",
    ],
    request: "Thank you, universe, because this is already mine.",
    closing: "Thank you. It is done.",
    fallbackTitle: "My visualization",
  },
};

/** Mezcla determinista: el mismo proyecto da siempre el mismo guion. */
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = (Math.imul(h, 48271) + 11) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Título a partir de la intención del usuario.
 *
 * Corta por palabra, no por carácter: "Dirijo mi propio estudio en Lisboa, con
 * tres personas en el" es peor que no tener título. Con LLM este camino no se
 * usa, porque el modelo devuelve un título escrito.
 */
function shortTitle(intention: string, locale: Locale): string {
  const clean = intention.trim().replace(/\s+/g, " ");
  if (!clean) return OPENING[locale].fallbackTitle;
  if (clean.length <= 48) return clean;
  const cut = clean.slice(0, 48);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut).replace(/[,;:]$/, "") + "…";
}

function asLine(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  const capital = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?…]$/.test(capital) ? capital : capital + ".";
}

/**
 * Área de vida a partir de lo que escribió la persona. Ya no se le pregunta:
 * sirve para el banco de respaldo y para ordenar el market, no para el guion.
 */
const AREA_HINTS: [LifeArea, RegExp][] = [
  ["abundancia", /dinero|money|mill[oó]n|millonari|rico|rich|abundan|ingres|income|ahorr|saving|invers|invest|financ|casa propia|my own house/i],
  ["salud", /salud|health|corr[eo]|run|gimnas|gym|peso|weight|energ|dorm|sleep|fuerte|strong|\bfit/i],
  ["amor", /amor|love|pareja|partner|relaci[oó]n|relationship|famil|boda|wedding|novi[oa]/i],
  ["confianza", /confian|confiden|autoestima|self-esteem|en p[uú]blico|public speaking|miedo|fear|segur[oa] de m[ií]/i],
  ["libertad", /viaj|travel|libertad|freedom|remot|n[oó]mada|nomad|otro pa[ií]s|abroad|playa|beach/i],
  ["carrera", /trabaj|work|empresa|company|negocio|business|client|ascens|promot|app\b|software|startup|lider|lead/i],
];

export function inferArea(text: string): LifeArea {
  let best: LifeArea = "carrera";
  let bestScore = 0;
  for (const [area, re] of AREA_HINTS) {
    const score = (text.match(new RegExp(re.source, "gi")) ?? []).length;
    if (score > bestScore) {
      best = area;
      bestScore = score;
    }
  }
  return best;
}

export function draftScript(input: {
  area: LifeArea;
  intention: string;
  durationSec: 30 | 60;
  tier: Tier;
  seed: string;
  locale: Locale;
  desires?: string[];
}): ScriptDraft {
  const desires = input.desires?.filter((d) => d.trim());
  const n = desires?.length || sceneCount(input.tier, input.durationSec);
  // Con deseos, la frase es el deseo en sus palabras: sin LLM no hay quien lo
  // pase a presente, pero es mejor que una frase genérica del banco.
  const affirmations = desires?.length
    ? desires.map(asLine)
    : seededShuffle(AFFIRMATIONS[input.locale][input.area], input.seed).slice(0, n);
  const briefs = seededShuffle(SCENES[input.area], input.seed + "s").slice(0, n);

  // La intención del usuario solo da título aquí. NO se inyecta en los briefs:
  // van a un modelo de imagen en inglés, y mezclar idiomas en un prompt
  // degrada el resultado. Las escenas que hablan de lo que el usuario escribió
  // salen del camino con LLM (lib/ai/llm.ts); este banco es la red de seguridad.
  return {
    title: shortTitle(input.intention, input.locale),
    hook: OPENING[input.locale].hook,
    gratitude: OPENING[input.locale].gratitude,
    request: OPENING[input.locale].request,
    affirmations,
    closing: OPENING[input.locale].closing,
    sceneBriefs: briefs,
  };
}

/**
 * Fracción del hueco de cada frase que ocupa la voz. El resto es silencio, y
 * ese silencio es el ejercicio: repetir en alto una frase de seis o siete
 * palabras lleva dos o tres segundos, así que el hueco tiene que ser
 * comparable a lo que dura decirla.
 */
const SPOKEN_RATIO = 0.55;

export function layoutTimeline(
  affirmations: string[],
  durationSec: number,
): Affirmation[] {
  const slot = durationSec / affirmations.length;
  return affirmations.map((text, i) => ({
    text,
    startSec: +(i * slot).toFixed(2),
    endSec: +(i * slot + slot * SPOKEN_RATIO).toFixed(2),
  }));
}

/** Escena en primera persona: el brief empieza por "POV:". */
export function isPovBrief(brief: string): boolean {
  return /^pov:\s*/i.test(brief);
}

/**
 * Una sola foto, una sola cara nítida: si hay más gente parecida cerca, el
 * modelo le copia la cara (caras duplicadas). Con reparto con fotos, applyCast
 * lo cambia por la versión para varias personas.
 */
const ALONE = "One single photograph of one moment, with the main subject as the only face in the image; anyone else appears only from behind or as a blurred silhouette far in the background";
const WITH_CAST = "One single photograph of one moment; the people from the figures are the only faces in the image; anyone else appears only from behind or as a blurred silhouette far in the background";

/** Compone el prompt final de imagen: identidad + escena + estilo + encuadre. */
export function buildScenePrompt(
  brief: string,
  style: VisualStyle,
  hasSelfie: boolean,
  photoCount = 1,
  body = "",
): string {
  const styleDef = VISUAL_STYLES.find((s) => s.id === style) ?? VISUAL_STYLES[0];
  // Escena subjetiva: se ve desde los ojos de la persona, así que no hay
  // cara que conservar. El pipeline tampoco le pasa las fotos: un modelo de
  // edición las usaría como base y metería la cara.
  // Con fotos, Seedream las llama "Figure 1..N": nombrarlas así ata la cara.
  const figures =
    photoCount > 1 ? `Figures 1 to ${photoCount}` : "Figure 1";
  const identity = isPovBrief(brief)
    ? "First-person point of view through the person's own eyes, only their hands visible"
    : hasSelfie
      ? `The main subject is exactly the person in ${figures}, with their own face, hair and features, natural likeness.${body ? ` ${body}.` : ""} ${ALONE}`
      : "A person seen from behind or at a distance";
  // Todo en positivo: las negaciones ("no text") el modelo las lee al revés.
  return [
    `Photorealistic high-definition photo. ${identity}. ${brief.replace(/^pov:\s*/i, "")}`,
    styleDef.prompt,
    "vertical framing, sharp focus on the face, crisp natural detail, clean image",
  ].join(". ");
}

export function buildScenes(
  briefs: string[],
  style: VisualStyle,
  hasSelfie: boolean,
  durationSec: number,
  photoCount = 1,
  body = "",
): Scene[] {
  const slot = durationSec / Math.max(1, briefs.length);
  return briefs.map((brief, i) => ({
    id: `sc_${i + 1}`,
    prompt: buildScenePrompt(brief, style, hasSelfie, photoCount, body),
    pov: isPovBrief(brief) || undefined,
    startSec: +(i * slot).toFixed(2),
    endSec: +((i + 1) * slot).toFixed(2),
    affirmationIndex: i,
  }));
}

/** Texto que se manda al TTS: gancho, afirmaciones con pausa, y cierre. */
export function narrationText(script: ScriptDraft): string {
  return [script.hook, ...script.affirmations, script.closing].join("\n\n");
}

// ── Personas con foto ──────────────────────────────────────────────────────

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Quién sale en una escena: las personas que el LLM marcó como [[Nombre]] en
 * la escena, o a las que el deseo nombra por su nombre o su relación.
 */
export function sceneCast(
  brief: string,
  desire: string | undefined,
  people: { id: string; name: string; relation?: string }[],
): string[] {
  const b = norm(brief);
  const d = norm(desire ?? "");
  return people
    .filter((p) => {
      const name = norm(p.name);
      if (b.includes(`[[${name}]]`)) return true;
      const word = (w: string) => w.length > 1 && new RegExp(`(^|[^a-z])${escapeRe(w)}([^a-z]|$)`).test(d);
      return word(name) || (!!p.relation && word(norm(p.relation.replace(/^(mi|my)\s+/i, ""))));
    })
    .map((p) => p.id);
}

/**
 * Sustituye cada [[Nombre]] por "la persona de las Figuras X a Y" y, si alguna
 * persona del reparto no aparece marcada, la añade al final de la escena.
 */
export function applyCast(
  prompt: string,
  cast: { name: string; first: number; last: number }[],
): string {
  let out = cast.length ? prompt.replace(ALONE, WITH_CAST) : prompt;
  const extra: string[] = [];
  for (const c of cast) {
    const figs = c.first === c.last ? `Figure ${c.first}` : `Figures ${c.first} to ${c.last}`;
    const who = `the person in ${figs}`;
    const re = new RegExp(`\\[\\[\\s*${escapeRe(c.name)}\\s*\\]\\]`, "gi");
    if (re.test(out)) out = out.replace(re, who);
    else extra.push(`Also in the scene, close to the main subject: ${who}`);
  }
  // Marcas de personas que no están en el reparto: se quitan los corchetes.
  out = out.replace(/\[\[\s*([^\]]+?)\s*\]\]/g, "a person");
  const identity = cast.length
    ? ` Each person keeps exactly their own face and features from their figures.`
    : "";
  return [out, ...extra].join(". ") + identity;
}
