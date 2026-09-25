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
 * para que entre en un respiro, y concreto antes que grandilocuente.
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
      "Atraigo a quien me trata bien.",
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
      "I attract people who treat me well.",
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

const OPENING: Record<Locale, { hook: string; closing: string; fallbackTitle: string }> = {
  es: {
    hook: "Respira. Esto ya está en camino.",
    closing: "Ya es tuyo. Solo tienes que sostenerlo.",
    fallbackTitle: "Mi visualización",
  },
  en: {
    hook: "Breathe. This is already on its way.",
    closing: "It's yours. You just have to hold it.",
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

export function draftScript(input: {
  area: LifeArea;
  intention: string;
  durationSec: 30 | 60;
  tier: Tier;
  seed: string;
  locale: Locale;
}): ScriptDraft {
  const n = sceneCount(input.tier, input.durationSec);
  const affirmations = seededShuffle(
    AFFIRMATIONS[input.locale][input.area],
    input.seed,
  ).slice(0, n);
  const briefs = seededShuffle(SCENES[input.area], input.seed + "s").slice(0, n);

  // La intención del usuario solo da título aquí. NO se inyecta en los briefs:
  // van a un modelo de imagen en inglés, y mezclar idiomas en un prompt
  // degrada el resultado. Las escenas que hablan de lo que el usuario escribió
  // salen del camino con LLM (lib/ai/llm.ts); este banco es la red de seguridad.
  return {
    title: shortTitle(input.intention, input.locale),
    hook: OPENING[input.locale].hook,
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

/** Compone el prompt final de imagen: identidad + escena + estilo + encuadre. */
export function buildScenePrompt(
  brief: string,
  style: VisualStyle,
  hasSelfie: boolean,
): string {
  const styleDef = VISUAL_STYLES.find((s) => s.id === style) ?? VISUAL_STYLES[0];
  const identity = hasSelfie
    ? "the person from the reference photo, same face and identity, natural likeness"
    : "a person seen from behind or at a distance, face not visible";
  return [
    `${identity}, ${brief}`,
    styleDef.prompt,
    "vertical 9:16 composition, high detail, no text, no watermark, no logos",
  ].join(", ");
}

/**
 * Las escenas NO usan el final de la afirmación como final propio: la voz
 * calla antes de que acabe el hueco, pero la imagen tiene que seguir ahí
 * mientras el usuario repite. Cada escena ocupa su franja entera.
 */
export function buildScenes(
  briefs: string[],
  style: VisualStyle,
  hasSelfie: boolean,
  durationSec: number,
): Scene[] {
  const slot = durationSec / Math.max(1, briefs.length);
  return briefs.map((brief, i) => ({
    id: `sc_${i + 1}`,
    prompt: buildScenePrompt(brief, style, hasSelfie),
    startSec: +(i * slot).toFixed(2),
    endSec: +((i + 1) * slot).toFixed(2),
    affirmationIndex: i,
  }));
}

/** Texto que se manda al TTS: gancho, afirmaciones con pausa, y cierre. */
export function narrationText(script: ScriptDraft): string {
  return [script.hook, ...script.affirmations, script.closing].join("\n\n");
}
