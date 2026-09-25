import type { IconName } from "@/components/Icon";
import type { Locale } from "./i18n/locale";

/** Un texto que existe en cada idioma. */
export type Localized<T> = Record<Locale, T>;

/** Dominio de Manifest. Un "proyecto" es un video de visualizacion. */

export type LifeArea =
  | "carrera"
  | "abundancia"
  | "salud"
  | "amor"
  | "confianza"
  | "libertad";

/**
 * Las áreas y los estilos guardan aquí solo lo que NO se traduce: el
 * identificador, el icono y el prompt que va al modelo de imagen. Las
 * etiquetas visibles viven en el diccionario (lib/i18n), porque cambian con
 * el idioma y esto no.
 */
export const LIFE_AREAS: { id: LifeArea; icon: IconName }[] = [
  { id: "carrera", icon: "briefcase" },
  { id: "abundancia", icon: "growth" },
  { id: "salud", icon: "pulse" },
  { id: "amor", icon: "heart" },
  { id: "confianza", icon: "person" },
  { id: "libertad", icon: "compass" },
];

/** Los dos productos. `vision` = imagenes fijas con movimiento. `cinematic` = escenas animadas. */
export type Tier = "vision" | "cinematic";

export type VisualStyle =
  | "cinematic"
  | "editorial"
  | "golden"
  | "minimal"
  | "dream";

/** El prompt de estilo va siempre en inglés: es lo que entiende el modelo. */
export const VISUAL_STYLES: { id: VisualStyle; prompt: string }[] = [
  { id: "cinematic", prompt: "cinematic film still, 35mm, shallow depth of field, moody volumetric light, anamorphic" },
  { id: "editorial", prompt: "high-end editorial photography, clean composition, natural light, magazine cover quality" },
  { id: "golden", prompt: "golden hour photography, warm sunlight, lens flare, soft glow, aspirational" },
  { id: "minimal", prompt: "minimal modern photography, neutral palette, architectural negative space, calm" },
  { id: "dream", prompt: "dreamlike ethereal photography, soft focus, pastel haze, surreal serenity" },
];

export type VoiceTone = "calma" | "firme" | "cercana";

export type ProjectStatus = "draft" | "queued" | "generating" | "ready" | "failed";

export type StepId = "script" | "images" | "motion" | "voice" | "assemble";

export interface PipelineStep {
  id: StepId;
  label: string;
  status: "pending" | "running" | "done" | "skipped" | "failed";
  startedAt?: number;
  endedAt?: number;
  error?: string;
  /** Coste real acumulado en esta etapa, en centimos de USD. */
  costCents?: number;
}

export interface Affirmation {
  /** Frase en primera persona, presente. El usuario la repite en voz alta. */
  text: string;
  startSec: number;
  endSec: number;
}

export interface Scene {
  id: string;
  /** Prompt enviado al modelo de imagen, ya con el estilo y la identidad. */
  prompt: string;
  imageUrl?: string;
  /** Solo en tier `cinematic`. */
  videoUrl?: string;
  startSec: number;
  endSec: number;
  /** Indice de la afirmacion que se muestra sobre esta escena. */
  affirmationIndex: number;
}

export interface ScriptDraft {
  title: string;
  /** Frase de apertura, no se repite en voz alta. */
  hook: string;
  affirmations: string[];
  closing: string;
  /** Descripcion visual de cada escena, en ingles, sin el estilo aplicado. */
  sceneBriefs: string[];
}

export interface Project {
  id: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  area: LifeArea;
  /** Lo que el usuario escribio: su intencion en sus palabras. */
  intention: string;
  tier: Tier;
  style: VisualStyle;
  tone: VoiceTone;
  durationSec: 30 | 60;
  /**
   * Idioma en el que se escribió el guion. Se fija al crear y no cambia
   * después: un vídeo generado en inglés no puede volverse español sin
   * regenerar la voz, así que el proyecto recuerda el suyo.
   */
  locale: Locale;
  /** Ruta publica del selfie subido. Nunca se comparte fuera de la cuenta. */
  selfieUrl?: string;
  status: ProjectStatus;
  steps: PipelineStep[];
  script?: ScriptDraft;
  affirmations: Affirmation[];
  scenes: Scene[];
  /**
   * Pista de voz. En modo mock no hay fichero: el reproductor usa la sintesis
   * de voz del navegador, que ademas deja probar el flujo sin gastar un euro.
   */
  voiceUrl?: string;
  voiceMode: "file" | "browser";
  musicKey?: string;
  /** MP4 final, si el ensamblado corrio. Si no, el player web es la entrega. */
  exportUrl?: string;
  /** Lo que pagó el usuario, en centavos de USD. 0 si fue el vídeo gratis. */
  paidCents: number;
  /** Coste de proveedor real, centimos de USD. Para medir margen. */
  costCents: number;
  /** Plantilla del market de la que nació, si aplica. */
  templateSlug?: string;
  watermark: boolean;
  error?: string;
}

/**
 * UNA PLANTILLA DEL MARKET
 *
 * Nace de un proyecto real: alguien crea su vídeo, le gusta, y lo publica.
 * Lo que se publica NO es el vídeo terminado, sino lo que hace falta para
 * reconstruirlo con otra cara: el guion, las escenas y el estilo.
 *
 * Su vídeo sí se ve en la ficha, como vista previa. Es suyo, lo publica a
 * sabiendas, y es lo que convence al comprador. Pero lo que el comprador
 * recibe se genera de nuevo con SU cara — nunca se le entrega el vídeo del
 * creador con una cara pegada encima.
 *
 * Esa distinción es la que sostiene el producto: el vídeo que te sirve para
 * visualizarte es aquel en el que sales tú.
 */
export interface Template {
  slug: string;
  title: Localized<string>;
  /** Nombre visible de quien la publicó. No se traduce. */
  author: string;
  /** Usuario real, cuando no es una plantilla de la casa. */
  creatorId?: string;
  /** Proyecto del que salió, para poder rastrear el origen. */
  sourceProjectId?: string;
  area: LifeArea;
  style: VisualStyle;
  tone: VoiceTone;
  tier: Tier;
  durationSec: 30 | 60;
  summary: Localized<string>;
  /**
   * Cuándo y cómo usarla: "los 7 días antes de la charla, al levantarte".
   * Es lo que separa una plantilla de una lista de frases bonitas.
   */
  protocol?: Localized<string>;
  affirmations: Localized<string[]>;
  /** Siempre en inglés: van a un modelo de imagen. */
  sceneBriefs: string[];
  /** La versión del creador. Lo que se ve en la ficha. */
  previewUrl?: string;
  cover: { from: string; to: string };
  publishedAt: number;
  /**
   * Cuántos vídeos se han generado a partir de ella. Contador real: empieza
   * en cero y solo sube cuando alguien la usa de verdad.
   */
  uses: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  /** Vídeos gratis ya consumidos. El primero invita la casa. */
  freeVideosUsed: number;
}
