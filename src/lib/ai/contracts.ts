import type {
  ClarifyAnswer,
  ClarifyQuestion,
  LifeArea,
  ScriptDraft,
  Tier,
  VoiceTone,
} from "../types";
import type { Locale } from "../i18n/locale";

/**
 * Toda llamada a un proveedor devuelve tambien lo que costo, para poder
 * cerrar el margen por video sin tener que reconstruirlo desde la factura.
 */
export interface Billed<T> {
  result: T;
  costCents: number;
  provider: string;
}

export interface ScriptProvider {
  name: string;
  write(input: {
    area: LifeArea;
    intention: string;
    durationSec: 30 | 60;
    tier: Tier;
    tone: VoiceTone;
    seed: string;
    locale: Locale;
    details?: ClarifyAnswer[];
    /** Si llega, manda: una escena y una frase por deseo, en su orden. */
    desires?: string[];
    /** Personas con foto que el usuario añadió. */
    people?: { name: string; relation?: string }[];
  }): Promise<Billed<ScriptDraft>>;
}

export interface ClarifyProvider {
  name: string;
  /** Una lista vacía significa "no hay nada que preguntar" o "no hay LLM". */
  ask(input: {
    area: LifeArea;
    intention: string;
    locale: Locale;
    desires?: string[];
  }): Promise<Billed<ClarifyQuestion[]>>;
}

export interface ImageProvider {
  name: string;
  generate(input: {
    prompt: string;
    /** Ruta absoluta en disco del selfie, si el usuario subio uno. */
    referencePath?: string;
    /** Varias fotos del usuario (mejor parecido). Si llega, manda sobre referencePath. */
    referencePaths?: string[];
    projectId: string;
    sceneId: string;
  }): Promise<Billed<{ url: string }>>;
}

export interface VideoProvider {
  name: string;
  animate(input: {
    imageUrl: string;
    prompt: string;
    durationSec: number;
    projectId: string;
    sceneId: string;
    /** "elevated" usa el modelo premium del nivel Elevado. */
    quality?: "standard" | "elevated";
  }): Promise<Billed<{ url: string }>>;
}

export interface VoiceProvider {
  name: string;
  speak(input: {
    text: string;
    tone: VoiceTone;
    projectId: string;
    locale?: Locale;
    voice?: string;
  }): Promise<Billed<{ url?: string; mode: "file" | "browser" }>>;
  /**
   * Una pista por frase (clave → texto). Es lo que usa el montaje nuevo, que
   * coloca cada frase en su escena. Los proveedores sin esto caen al montaje
   * antiguo con una sola pista de narración.
   */
  speakLines?(input: {
    lines: Record<string, string>;
    projectId: string;
    locale: Locale;
    voice?: string;
  }): Promise<Billed<Record<string, string>>>;
}
