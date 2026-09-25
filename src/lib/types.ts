import type { IconName } from "@/components/Icon";

/** Dominio de Manifest. Un "proyecto" es un video de visualizacion. */

export type LifeArea =
  | "carrera"
  | "abundancia"
  | "salud"
  | "amor"
  | "confianza"
  | "libertad";

export const LIFE_AREAS: {
  id: LifeArea;
  label: string;
  blurb: string;
  icon: IconName;
}[] = [
  { id: "carrera", label: "Carrera y propósito", blurb: "Ascenso, negocio propio, reconocimiento", icon: "briefcase" },
  { id: "abundancia", label: "Abundancia", blurb: "Dinero, libertad financiera, prosperidad", icon: "growth" },
  { id: "salud", label: "Salud y cuerpo", blurb: "Energía, fuerza, hábitos que sostienes", icon: "pulse" },
  { id: "amor", label: "Amor y vínculos", blurb: "Pareja, familia, relaciones sanas", icon: "heart" },
  { id: "confianza", label: "Confianza", blurb: "Autoestima, presencia, hablar sin miedo", icon: "person" },
  { id: "libertad", label: "Libertad y viaje", blurb: "Nómada, tiempo propio, vivir donde quieras", icon: "compass" },
];

/** Los dos productos. `vision` = imagenes fijas con movimiento. `cinematic` = escenas animadas. */
export type Tier = "vision" | "cinematic";

export type VisualStyle =
  | "cinematic"
  | "editorial"
  | "golden"
  | "minimal"
  | "dream";

export const VISUAL_STYLES: { id: VisualStyle; label: string; prompt: string }[] = [
  { id: "cinematic", label: "Cinematográfico", prompt: "cinematic film still, 35mm, shallow depth of field, moody volumetric light, anamorphic" },
  { id: "editorial", label: "Editorial", prompt: "high-end editorial photography, clean composition, natural light, magazine cover quality" },
  { id: "golden", label: "Hora dorada", prompt: "golden hour photography, warm sunlight, lens flare, soft glow, aspirational" },
  { id: "minimal", label: "Minimal", prompt: "minimal modern photography, neutral palette, architectural negative space, calm" },
  { id: "dream", label: "Onírico", prompt: "dreamlike ethereal photography, soft focus, pastel haze, surreal serenity" },
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
  title: string;
  /** Nombre visible de quien la publicó. */
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
  summary: string;
  /**
   * Cuándo y cómo usarla: "los 7 días antes de la charla, al levantarte".
   * Es lo que separa una plantilla de una lista de frases bonitas.
   */
  protocol?: string;
  affirmations: string[];
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
