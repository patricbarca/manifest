import type { Locale } from "./i18n/locale";

/**
 * Voces que se pueden elegir para el vídeo. Son voces de ElevenLabs (vía fal)
 * que hablan los dos idiomas; cada una tiene una muestra corta por idioma en
 * public/voices/<id>-<locale>.mp3 para escucharla antes de elegir.
 */
export interface VoiceOption {
  id: string;
  gender: "female" | "male";
  label: Record<Locale, string>;
}

export const VOICES: VoiceOption[] = [
  { id: "Sarah", gender: "female", label: { es: "Sarah · cálida y serena", en: "Sarah · warm and calm" } },
  { id: "Matilda", gender: "female", label: { es: "Matilda · cercana", en: "Matilda · friendly" } },
  { id: "Alice", gender: "female", label: { es: "Alice · clara", en: "Alice · clear" } },
  { id: "George", gender: "male", label: { es: "George · cálido", en: "George · warm" } },
  { id: "Brian", gender: "male", label: { es: "Brian · grave y pausado", en: "Brian · deep and slow" } },
];

export const DEFAULT_VOICE = "Sarah";
export const VOICE_IDS = VOICES.map((v) => v.id) as [string, ...string[]];

export function voiceSample(id: string, locale: Locale): string {
  return `/voices/${id.toLowerCase()}-${locale}.mp3`;
}
