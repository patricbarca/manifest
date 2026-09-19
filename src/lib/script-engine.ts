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

/**
 * Banco base por area. Sirve para dos cosas:
 *  - fallback determinista cuando no hay LLM configurado (modo mock)
 *  - few-shot que se le pasa al LLM para fijar el tono
 *
 * Reglas del guion: primera persona, presente, afirmativo (sin "no"), corto
 * para que entre en un respiro, y concreto antes que grandilocuente.
 */
const BANK: Record<LifeArea, { affirmations: string[]; scenes: string[] }> = {
  carrera: {
    affirmations: [
      "Merezco el trabajo que estoy construyendo.",
      "Hablo con claridad y me escuchan.",
      "Tomo decisiones difíciles con calma.",
      "Mi trabajo abre puertas que aún no veo.",
      "Cada día soy mejor en lo que hago.",
      "Lidero desde la confianza, no desde el miedo.",
      "El reconocimiento llega porque lo he ganado.",
      "Digo que sí a lo que me hace crecer.",
    ],
    scenes: [
      "confident professional walking into a bright modern office lobby at sunrise",
      "presenting to an attentive boardroom, warm light through floor-to-ceiling windows",
      "signing a contract at a clean desk, calm and focused",
      "being congratulated by colleagues, genuine smiles, candid moment",
      "working late with quiet focus, city skyline glowing behind",
      "stepping onto a stage to speak, audience silhouettes, spotlight",
      "opening the door of a private office with their name on it",
      "celebrating a launch with a small team, confetti, natural joy",
    ],
  },
  abundancia: {
    affirmations: [
      "El dinero llega a mí de formas que puedo sostener.",
      "Administro lo que tengo con serenidad.",
      "Soy generoso porque tengo de sobra.",
      "Mi valor se traduce en ingresos.",
      "Recibo sin culpa lo que he trabajado.",
      "Tomo decisiones de dinero desde la abundancia.",
      "Mi cuenta crece mes a mes.",
      "Vivo tranquilo con lo que gano.",
    ],
    scenes: [
      "standing at a window of a serene apartment overlooking the city at dawn",
      "reviewing a growing chart on a tablet, relaxed posture, morning coffee",
      "handing keys of a new home, warm afternoon light",
      "dining with family at a long table full of food, laughter",
      "walking through a calm high-end space, unhurried and at ease",
      "placing a bag in the trunk of a car before a trip, easy smile",
      "donating at a community event, warm connection",
      "reading on a terrace with the sea in the distance, golden hour",
    ],
  },
  salud: {
    affirmations: [
      "Mi cuerpo es fuerte y responde.",
      "Elijo lo que me da energía.",
      "Respiro hondo y mi cuerpo se calma.",
      "Descanso porque me cuido.",
      "Cada día me muevo con más soltura.",
      "Trato a mi cuerpo con respeto.",
      "Tengo energía para lo que me importa.",
      "Mi salud es la base de todo lo demás.",
    ],
    scenes: [
      "running along a coastal path at sunrise, strong stride",
      "stretching in a sunlit room, calm morning routine",
      "preparing a colorful fresh meal in a bright kitchen",
      "swimming in clear open water, powerful and free",
      "lifting weights in a clean gym, focused expression",
      "hiking a green ridge with wide open sky",
      "sleeping peacefully in a quiet bedroom, soft dawn light",
      "laughing outdoors with friends after exercise, healthy glow",
    ],
  },
  amor: {
    affirmations: [
      "Doy y recibo amor con las manos abiertas.",
      "Soy suficiente tal y como soy.",
      "Digo lo que siento sin miedo.",
      "Atraigo a quien me trata bien.",
      "Elijo relaciones que me suman.",
      "Pongo límites y sigo siendo querido.",
      "Confío en lo que se está formando.",
      "Merezco un amor tranquilo.",
    ],
    scenes: [
      "walking hand in hand along a quiet street at dusk",
      "sharing a slow breakfast by a sunlit window, easy intimacy",
      "dancing in a living room, unposed and happy",
      "being embraced on a beach at golden hour",
      "laughing at a dinner table with close friends, candlelight",
      "watching the sunset from a balcony together, calm",
      "a warm reunion at an airport arrivals hall",
      "sitting close on a sofa reading, comfortable silence",
    ],
  },
  confianza: {
    affirmations: [
      "Ocupo mi espacio sin pedir permiso.",
      "Mi voz merece ser escuchada.",
      "Me sostengo aunque me tiemble la voz.",
      "Soy capaz de aprender lo que haga falta.",
      "Dejo de compararme y sigo mi paso.",
      "Me miro y me gusto.",
      "Actúo aunque tenga miedo.",
      "Confío en mi criterio.",
    ],
    scenes: [
      "standing tall in front of a mirror, calm direct gaze",
      "speaking into a microphone on a small stage, self-assured",
      "walking through a crowded street with steady posture",
      "raising a hand to speak in a full room",
      "portrait against a plain wall, soft light, quiet strength",
      "entering a room as heads turn, unbothered and composed",
      "writing in a journal by a window, deliberate",
      "stepping outside at dawn, deep breath, wide sky",
    ],
  },
  libertad: {
    affirmations: [
      "Diseño mis días a mi manera.",
      "Mi tiempo me pertenece.",
      "Trabajo desde donde quiero estar.",
      "Elijo la vida que quiero vivir.",
      "Confío en el camino que estoy abriendo.",
      "Me muevo ligero.",
      "Lo simple me basta y me sobra.",
      "Soy libre y responsable a la vez.",
    ],
    scenes: [
      "working on a laptop on a terrace overlooking the ocean",
      "boarding a plane with a single small bag, calm excitement",
      "driving an empty coastal road at golden hour, window down",
      "waking up in a sunlit room in an unfamiliar city",
      "walking through a foreign market, curious and relaxed",
      "sitting on a cliff edge looking at a wide valley",
      "a slow coffee at a corner cafe, no rush",
      "watching the stars from a quiet campsite",
    ],
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
 * Guion determinista. Es el fallback y tambien lo que corre en modo mock.
 * Cuando hay LLM, `generateScript` en lib/ai lo usa como few-shot y devuelve
 * algo mas personalizado, pero con esta misma forma.
 */
export function draftScript(input: {
  area: LifeArea;
  intention: string;
  durationSec: 30 | 60;
  tier: Tier;
  seed: string;
}): ScriptDraft {
  const bank = BANK[input.area];
  const n = sceneCount(input.tier, input.durationSec);
  const affirmations = seededShuffle(bank.affirmations, input.seed).slice(0, n);
  const briefs = seededShuffle(bank.scenes, input.seed + "s").slice(0, n);

  // Aqui la intencion del usuario solo da titulo. NO se inyecta en los briefs:
  // el usuario escribe en español y los briefs van a un modelo de imagen en
  // ingles, y mezclar idiomas en un prompt degrada el resultado. Las escenas
  // que hablan de lo que el usuario escribio salen del camino con LLM
  // (lib/ai/llm.ts); este banco es la red de seguridad.
  return {
    title: input.intention.trim().slice(0, 60) || "Mi visualización",
    hook: "Respira. Esto ya está en camino.",
    affirmations,
    closing: "Ya es tuyo. Solo tienes que sostenerlo.",
    sceneBriefs: briefs,
  };
}

/** Reparte las afirmaciones a lo largo de la duracion, con aire para repetirlas. */
export function layoutTimeline(
  affirmations: string[],
  durationSec: number,
): Affirmation[] {
  const slot = durationSec / affirmations.length;
  return affirmations.map((text, i) => ({
    text,
    startSec: +(i * slot).toFixed(2),
    // Un pequeno hueco al final de cada slot: el silencio es donde el usuario repite.
    endSec: +((i + 1) * slot - slot * 0.12).toFixed(2),
  }));
}

/** Compone el prompt final de imagen: identidad + escena + estilo + encuadre. */
export function buildScenePrompt(brief: string, style: VisualStyle, hasSelfie: boolean): string {
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

export function buildScenes(
  briefs: string[],
  style: VisualStyle,
  hasSelfie: boolean,
  timeline: Affirmation[],
): Scene[] {
  return briefs.map((brief, i) => ({
    id: `sc_${i + 1}`,
    prompt: buildScenePrompt(brief, style, hasSelfie),
    startSec: timeline[i]?.startSec ?? 0,
    endSec: timeline[i]?.endSec ?? 0,
    affirmationIndex: i,
  }));
}

/** Texto que se manda al TTS: gancho, afirmaciones con pausa, y cierre. */
export function narrationText(script: ScriptDraft): string {
  return [script.hook, ...script.affirmations, script.closing].join("\n\n");
}
