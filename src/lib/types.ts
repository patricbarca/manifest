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
  creditsSpent: number;
  /** Coste de proveedor real, centimos de USD. Para medir margen. */
  costCents: number;
  /** Plantilla del market de la que nacio, si aplica. */
  blueprintSlug?: string;
  watermark: boolean;
  error?: string;
}

export interface Blueprint {
  slug: string;
  title: string;
  author: string;
  area: LifeArea;
  style: VisualStyle;
  tone: VoiceTone;
  tier: Tier;
  priceCents: number;
  sales: number;
  rating: number;
  summary: string;
  affirmations: string[];
  sceneBriefs: string[];
  cover: { from: string; to: string };
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanId;
  credits: number;
  createdAt: number;
}

export type PlanId = "free" | "semilla" | "creador" | "visionario";
