import type { Locale } from "./i18n/locale";
import { QUOTES, quoteById } from "./quotes";

/**
 * Lo fijo del vídeo: bienvenida, respiración, cita, cierre "repite conmigo".
 *
 * La estructura salió de las pruebas con usuarios reales (octubre de 2026):
 * logo → una cita → respiración guiada 4/6 → una escena por deseo con su
 * frase → "repite conmigo" ×3 → "Gracias. Ya está hecho." → logo.
 * Lo que cambia por usuario (las frases y las escenas) viene del guion.
 */

export interface ExperienceTexts {
  tagline: string;
  /** Lo que dice la voz antes de respirar. */
  welcome: string;
  /** Etiquetas dentro de la esfera. */
  breathIn: string;
  breathOut: string;
  /** Lo que dice la voz al empezar cada fase. */
  cueIn: string;
  cueOut: string;
  repeatLabel: string;
  repeatAfterMe: string;
  /** "Ahora… repite conmigo." dicho por la voz. */
  ramVoice: string;
  closeLine: string;
  seal: string;
  tomorrow: string;
}

export const EXPERIENCE: Record<Locale, ExperienceTexts> = {
  es: {
    tagline: "Tu visión, hoy.",
    welcome:
      "Te doy la bienvenida a la manifestación de hoy... Vamos a empezar con un ritmo de respiración, para que lo mantengas mientras hacemos esto. Sigue el círculo.",
    breathIn: "Inhala",
    breathOut: "Suelta",
    cueIn: "Inhala...",
    cueOut: "Y suelta...",
    repeatLabel: "Repite",
    repeatAfterMe: "Repite conmigo",
    ramVoice: "Ahora... repite conmigo.",
    closeLine: "Estoy viviendo esta vida ahora. Ya es mía.",
    seal: "Gracias. Ya está hecho.",
    tomorrow: "Mañana, a la misma hora.",
  },
  en: {
    tagline: "Your vision, today.",
    welcome:
      "Welcome to today's manifestation... We're going to start with a breathing rhythm, for you to keep while we do this. Follow the circle.",
    breathIn: "Breathe in",
    breathOut: "Let go",
    cueIn: "Breathe in...",
    cueOut: "And let go...",
    repeatLabel: "Repeat",
    repeatAfterMe: "Repeat after me",
    ramVoice: "Now... repeat after me.",
    closeLine: "I am living this life now. It is already mine.",
    seal: "Thank you. It is done.",
    tomorrow: "Tomorrow, same time.",
  },
};

/** La frase de apertura de un vídeo, en su idioma. */
export function quoteText(locale: Locale, quoteId: string | undefined, seed: string) {
  const q = quoteById(quoteId) ?? QUOTES[hashIndex(seed, QUOTES.length)];
  return { text: q[locale], author: q.author ?? "" };
}

function hashIndex(seed: string, n: number): number {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % n;
}

/** Todas las frases que dice la voz, con la clave que espera el montaje. */
export function voiceLines(
  locale: Locale,
  seed: string,
  affirmations: string[],
  quoteId?: string,
): Record<string, string> {
  const x = EXPERIENCE[locale];
  const q = quoteText(locale, quoteId, seed);
  const lines: Record<string, string> = {
    welcome: x.welcome,
    bin: x.cueIn,
    bout: x.cueOut,
    // Sin autor (idea sin atribuir) la voz solo dice la frase.
    q0: q.author ? `${q.text} ${q.author}.` : q.text,
    ram: x.ramVoice,
    close: x.closeLine,
    seal: x.seal,
  };
  affirmations.forEach((a, i) => (lines[`a${i}`] = a));
  return lines;
}

/** Duración de cada escena según su frase: la frase, y una pausa para repetirla. */
export function sceneLength(voiceSec: number): number {
  return 0.9 + voiceSec + Math.max(3.0, voiceSec + 1.0);
}
